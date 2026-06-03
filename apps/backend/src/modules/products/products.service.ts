import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ProductsService {
  private anthropic: Anthropic | null = null;

  constructor(@InjectRepository(Product) private repo: Repository<Product>) {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const exists = await this.repo.findOne({ where: { barcode: dto.barcode } });
    if (exists) throw new ConflictException('Barcode already exists');

    const product = this.repo.create({
      ...dto,
      category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
    });
    return this.repo.save(product);
  }

  findAll(search?: string): Promise<Product[]> {
    const where: any = { isActive: true };
    if (search) where.name = Like(`%${search}%`);
    return this.repo.find({ where, order: { name: 'ASC' }, relations: ['category'] });
  }

  async findOne(id: string): Promise<Product> {
    const p = await this.repo.findOne({ where: { id }, relations: ['category'] });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async findByBarcode(barcode: string): Promise<Product> {
    const p = await this.repo.findOne({ where: { barcode }, relations: ['category'] });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const data = dto as any;
    if (data.categoryId) {
      (product as any).category = { id: data.categoryId };
      delete data.categoryId;
    }
    Object.assign(product, data);
    return this.repo.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.repo.save(product);
  }

  // Open Food Facts API orqali barkod qidirish
  async lookupByBarcode(barcode: string): Promise<any> {
    // Avval lokal DB dan qidirish
    const local = await this.repo.findOne({ where: { barcode }, relations: ['category'] });
    if (local) return { source: 'local', product: local };

    // Open Food Facts — bepul, millionlab mahsulot
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        { signal: AbortSignal.timeout(6000) },
      );
      const json: any = await res.json();

      if (json.status !== 1) return null;

      const p = json.product;
      // Nom: rus → o'zbek → ingliz → generic
      const name =
        p.product_name_ru ||
        p.product_name_uz ||
        p.product_name_en ||
        p.product_name ||
        '';

      // O'lchov birligini aniqlash
      const qty: string = (p.quantity || '').toLowerCase();
      let unit = 'pcs';
      if (qty.includes('ml') || qty.includes('мл')) unit = 'ml';
      else if (qty.includes(' l') || qty.endsWith('л') || qty.includes('литр')) unit = 'l';
      else if (qty.includes(' g') || qty.includes('гр') || qty.includes('грамм')) unit = 'g';
      else if (qty.includes('kg') || qty.includes('кг')) unit = 'kg';

      return {
        source: 'openfoodfacts',
        product: {
          barcode,
          name: name.trim(),
          brand: (p.brands || '').split(',')[0].trim(),
          unit,
          quantity: p.quantity || '',
          imageUrl: p.image_front_url || p.image_url || '',
          categoryHint: (p.categories_hierarchy || []).slice(-1)[0]?.replace('en:', '') || '',
          ingredients: (p.ingredients_text_ru || p.ingredients_text || '').slice(0, 200),
        },
      };
    } catch {
      return null;
    }
  }

  // Claude Vision orqali rasm tahlil qilish
  async recognizeByImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<any> {
    if (!this.anthropic) {
      return { error: 'ANTHROPIC_API_KEY sozlanmagan' };
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType as any, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Bu mahsulot rasmini tahlil qil. Faqat JSON qaytarging (boshqa matn yo'q):
{
  "name": "mahsulot nomi (o'zbek/rus tilida)",
  "brand": "brend nomi",
  "unit": "pcs|kg|g|l|ml",
  "categoryHint": "kategoriya (oziq-ovqat, shaxsiy gigiena, uy-ro'zg'or, ichimlik...)",
  "confidence": "high|medium|low"
}`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Tanib bo\'lmadi', raw: text };
    } catch {
      return { error: 'JSON parse xatosi', raw: text };
    }
  }
}

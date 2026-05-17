import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

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
}

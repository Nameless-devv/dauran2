import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { PurchaseOrder, PurchaseItem, PurchaseStatus } from './entities/purchase-order.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock) private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement) private movementRepo: Repository<StockMovement>,
    @InjectRepository(PurchaseOrder) private purchaseRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseItem) private purchaseItemRepo: Repository<PurchaseItem>,
    private dataSource: DataSource,
  ) {}

  async getStock(): Promise<Stock[]> {
    return this.stockRepo.find({ relations: ['product', 'product.category'] });
  }

  async getStockByProduct(productId: string): Promise<Stock | null> {
    return this.stockRepo.findOne({
      where: { product: { id: productId } },
      relations: ['product'],
    });
  }

  async getLowStock(): Promise<Stock[]> {
    return this.dataSource.query(`
      SELECT s.*, p.name, p.barcode
      FROM stock s JOIN products p ON s.product_id = p.id
      WHERE s.qty <= s.min_qty AND p.is_active = true
    `);
  }

  async createPurchase(dto: CreatePurchaseDto, userId: string): Promise<PurchaseOrder> {
    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(PurchaseOrder, {
        supplier: { id: dto.supplierId } as any,
        user: { id: userId } as any,
        status: PurchaseStatus.RECEIVED,
      });

      let total = 0;
      const items: PurchaseItem[] = [];

      for (const itemDto of dto.items) {
        const item = manager.create(PurchaseItem, {
          product: { id: itemDto.productId } as any,
          qty: itemDto.qty,
          costPrice: itemDto.costPrice,
          expiryDate: itemDto.expiryDate ? new Date(itemDto.expiryDate) : (null as any),
        });
        total += itemDto.qty * itemDto.costPrice;
        items.push(item);
      }

      order.total = total;
      order.items = items;
      const savedOrder = await manager.save(PurchaseOrder, order);

      for (const itemDto of dto.items) {
        let stock = await manager.findOne(Stock, {
          where: { product: { id: itemDto.productId } },
        });
        if (!stock) {
          stock = manager.create(Stock, {
            product: { id: itemDto.productId } as any,
            qty: 0,
          });
        }
        const prevQty = Number(stock.qty);
        stock.qty = prevQty + itemDto.qty;
        await manager.save(Stock, stock);

        await manager.save(StockMovement, manager.create(StockMovement, {
          product: { id: itemDto.productId } as any,
          type: MovementType.PURCHASE,
          qty: itemDto.qty,
          balanceAfter: stock.qty,
          referenceId: savedOrder.id,
          user: { id: userId } as any,
        }));
      }

      return savedOrder;
    });
  }

  async adjustStock(productId: string, qty: number, note: string, userId: string): Promise<Stock> {
    return this.dataSource.transaction(async (manager) => {
      let stock = await manager.findOne(Stock, {
        where: { product: { id: productId } },
      });
      if (!stock) {
        stock = manager.create(Stock, {
          product: { id: productId } as any,
          qty: 0,
        });
      }
      const newQty = Number(stock.qty) + qty;
      if (newQty < 0) throw new BadRequestException('Stock cannot go negative');

      stock.qty = newQty;
      await manager.save(Stock, stock);

      await manager.save(StockMovement, manager.create(StockMovement, {
        product: { id: productId } as any,
        type: MovementType.ADJUSTMENT,
        qty,
        balanceAfter: newQty,
        note,
        user: { id: userId } as any,
      }));

      return stock;
    });
  }

  getMovements(productId?: string): Promise<StockMovement[]> {
    const where = productId ? { product: { id: productId } } : {};
    return this.movementRepo.find({
      where,
      relations: ['product', 'user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  getPurchases(): Promise<PurchaseOrder[]> {
    return this.purchaseRepo.find({
      relations: ['supplier', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }
}

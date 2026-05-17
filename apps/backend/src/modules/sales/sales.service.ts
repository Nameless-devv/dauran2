import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Sale, SaleItem, SaleStatus } from './entities/sale.entity';
import { Stock } from '../stock/entities/stock.entity';
import { StockMovement, MovementType } from '../stock/entities/stock-movement.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CustomersService } from '../customers/customers.service';
import { ShiftsService } from '../shifts/shifts.service';

const BONUS_RATE = 0.01;

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private itemRepo: Repository<SaleItem>,
    private dataSource: DataSource,
    private customersService: CustomersService,
    private shiftsService: ShiftsService,
  ) {}

  private generateReceiptNo(): string {
    const now = new Date();
    return `R${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`;
  }

  async create(dto: CreateSaleDto, cashierId: string): Promise<Sale> {
    return this.dataSource.transaction(async (manager) => {
      let subtotal = 0;
      const saleItems: Partial<SaleItem>[] = [];

      for (const itemDto of dto.items) {
        const stock = await manager.findOne(Stock, {
          where: { product: { id: itemDto.productId } },
          relations: ['product'],
        });
        if (!stock) throw new BadRequestException(`Product ${itemDto.productId} not in stock`);
        if (Number(stock.qty) < itemDto.qty) {
          throw new BadRequestException(`Insufficient stock for ${stock.product.name}`);
        }

        const itemDiscount = itemDto.discount || 0;
        const itemTotal = itemDto.qty * itemDto.price - itemDiscount;
        subtotal += itemTotal;

        saleItems.push({
          product: { id: itemDto.productId } as any,
          qty: itemDto.qty,
          price: itemDto.price,
          discount: itemDiscount,
          total: itemTotal,
          vatRate: stock.product.vatRate,
        });

        const newQty = Number(stock.qty) - itemDto.qty;
        stock.qty = newQty;
        await manager.save(Stock, stock);

        await manager.save(StockMovement, manager.create(StockMovement, {
          product: { id: itemDto.productId } as any,
          type: MovementType.SALE,
          qty: -itemDto.qty,
          balanceAfter: newQty,
          user: { id: cashierId } as any,
        }));
      }

      const discount = dto.discount || 0;
      const bonusUsed = dto.bonusUsed || 0;
      const total = Math.max(0, subtotal - discount - bonusUsed);
      const change = dto.paid - total;

      if (change < 0) throw new BadRequestException('Paid amount is insufficient');

      const bonusEarned = Math.floor(total * BONUS_RATE);

      const sale = manager.create(Sale, {
        receiptNo: this.generateReceiptNo(),
        cashier: { id: cashierId } as any,
        customer: dto.customerId ? ({ id: dto.customerId } as any) : null,
        shift: dto.shiftId ? ({ id: dto.shiftId } as any) : null,
        subtotal,
        discount,
        total,
        paid: dto.paid,
        change,
        paymentType: dto.paymentType,
        bonusUsed,
        bonusEarned,
        items: saleItems as SaleItem[],
      });

      const savedSale = await manager.save(Sale, sale);

      if (dto.customerId) {
        if (bonusUsed > 0) await this.customersService.useBonus(dto.customerId, bonusUsed);
        if (bonusEarned > 0) await this.customersService.addBonus(dto.customerId, bonusEarned);
      }

      if (dto.shiftId) {
        await this.shiftsService.updateTotals(dto.shiftId, total);
      }

      return savedSale;
    });
  }

  findAll(from?: Date, to?: Date): Promise<Sale[]> {
    const where: any = {};
    if (from && to) where.createdAt = Between(from, to);
    return this.saleRepo.find({
      where,
      relations: ['cashier', 'customer', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepo.findOne({
      where: { id },
      relations: ['cashier', 'customer', 'items', 'items.product'],
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async returnSale(id: string): Promise<Sale> {
    return this.dataSource.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id },
        relations: ['items', 'items.product'],
      });
      if (!sale) throw new NotFoundException('Sale not found');
      if (sale.status === SaleStatus.RETURNED) throw new BadRequestException('Already returned');

      for (const item of sale.items) {
        await manager.increment(Stock, { product: { id: item.product.id } }, 'qty', item.qty);
        await manager.save(StockMovement, manager.create(StockMovement, {
          product: { id: item.product.id } as any,
          type: MovementType.RETURN,
          qty: item.qty,
          balanceAfter: 0,
          referenceId: sale.id,
        }));
      }

      sale.status = SaleStatus.RETURNED;
      return manager.save(Sale, sale);
    });
  }
}

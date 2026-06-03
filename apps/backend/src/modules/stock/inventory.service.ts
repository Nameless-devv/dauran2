import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Inventory, InventoryItem, InventoryStatus } from './entities/inventory.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory) private inventoryRepo: Repository<Inventory>,
    @InjectRepository(InventoryItem) private itemRepo: Repository<InventoryItem>,
    private dataSource: DataSource,
  ) {}

  // Yangi revizyani boshlash — barcha mahsulotlar tizim qoldig'i bilan yuklanadi
  async startInventory(userId: string, note?: string): Promise<Inventory> {
    const active = await this.inventoryRepo.findOne({
      where: { status: InventoryStatus.IN_PROGRESS },
    });
    if (active) throw new BadRequestException('Boshqa revizyа allaqachon davom etmoqda');

    return this.dataSource.transaction(async (manager) => {
      const inventory = manager.create(Inventory, {
        note,
        createdBy: { id: userId } as any,
        status: InventoryStatus.IN_PROGRESS,
      });
      const saved = await manager.save(Inventory, inventory);

      const stocks = await manager.find(Stock, { relations: ['product'] });
      const inventoryItems: Partial<InventoryItem>[] = stocks.map((s) => ({
        inventory: { id: saved.id } as any,
        product: { id: s.product.id } as any,
        systemQty: Number(s.qty),
        actualQty: null as any,
        difference: null as any,
      }));

      await manager.save(InventoryItem, inventoryItems);
      return manager.findOne(Inventory, { where: { id: saved.id } }) as Promise<Inventory>;
    });
  }

  // Haqiqiy miqdorni kiritish
  async updateActualQty(
    inventoryId: string,
    productId: string,
    actualQty: number,
    note?: string,
  ): Promise<InventoryItem> {
    const item = await this.itemRepo.findOne({
      where: {
        inventory: { id: inventoryId },
        product: { id: productId },
      },
      relations: ['product'],
    });
    if (!item) throw new NotFoundException('Item not found');

    item.actualQty = actualQty;
    item.difference = actualQty - Number(item.systemQty);
    item.note = note || item.note;
    return this.itemRepo.save(item);
  }

  // Revizyani yakunlash — farqlarni omborga qo'llash
  async completeInventory(inventoryId: string, userId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepo.findOne({
      where: { id: inventoryId },
      relations: ['items', 'items.product'],
    });
    if (!inventory) throw new NotFoundException('Inventory not found');
    if (inventory.status !== InventoryStatus.IN_PROGRESS) {
      throw new BadRequestException('Revizya davom etmayapti');
    }

    return this.dataSource.transaction(async (manager) => {
      let totalDiff = 0;

      for (const item of inventory.items) {
        if (item.actualQty === null || item.actualQty === undefined) continue;

        const diff = Number(item.actualQty) - Number(item.systemQty);
        totalDiff += diff * Number(item.product.costPrice);

        if (diff !== 0) {
          await manager.update(Stock,
            { product: { id: item.product.id } },
            { qty: item.actualQty }
          );
          await manager.save(StockMovement, manager.create(StockMovement, {
            product: { id: item.product.id } as any,
            type: MovementType.ADJUSTMENT,
            qty: diff,
            balanceAfter: item.actualQty,
            note: `Revizya #${inventoryId.slice(0, 8)}`,
            user: { id: userId } as any,
            referenceId: inventoryId,
          }));
        }
      }

      inventory.status = InventoryStatus.COMPLETED;
      inventory.completedAt = new Date();
      inventory.totalDifference = totalDiff;
      return manager.save(Inventory, inventory);
    });
  }

  getAll(): Promise<Inventory[]> {
    return this.inventoryRepo.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOne(id: string): Promise<Inventory> {
    const inv = await this.inventoryRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.product.category', 'createdBy'],
    });
    if (!inv) throw new NotFoundException('Inventory not found');
    return inv;
  }

  async getActive(): Promise<Inventory | null> {
    return this.inventoryRepo.findOne({
      where: { status: InventoryStatus.IN_PROGRESS },
      relations: ['items', 'items.product'],
    });
  }
}

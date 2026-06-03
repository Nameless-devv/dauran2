import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { PurchaseOrder, PurchaseItem } from './entities/purchase-order.entity';
import { Inventory, InventoryItem } from './entities/inventory.entity';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stock, StockMovement, PurchaseOrder, PurchaseItem,
      Inventory, InventoryItem,
    ]),
  ],
  providers: [StockService, InventoryService],
  controllers: [StockController, InventoryController],
  exports: [StockService, InventoryService],
})
export class StockModule {}

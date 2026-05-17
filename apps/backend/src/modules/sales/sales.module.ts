import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale, SaleItem } from './entities/sale.entity';
import { Stock } from '../stock/entities/stock.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { CustomersModule } from '../customers/customers.module';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Stock, StockMovement]),
    CustomersModule,
    ShiftsModule,
  ],
  providers: [SalesService],
  controllers: [SalesController],
  exports: [SalesService],
})
export class SalesModule {}

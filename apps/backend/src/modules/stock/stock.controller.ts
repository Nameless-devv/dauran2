import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsNumber, IsOptional } from 'class-validator';

class AdjustDto {
  @IsNumber()
  qty: number;
  @IsString()
  @IsOptional()
  note?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly service: StockService) {}

  @Get()
  getStock() {
    return this.service.getStock();
  }

  @Get('low')
  getLowStock() {
    return this.service.getLowStock();
  }

  @Get('movements')
  getMovements(@Query('productId') productId?: string) {
    return this.service.getMovements(productId);
  }

  @Get('purchases')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STOREKEEPER, Role.ACCOUNTANT)
  getPurchases() {
    return this.service.getPurchases();
  }

  @Post('purchases')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STOREKEEPER)
  createPurchase(@Body() dto: CreatePurchaseDto, @CurrentUser() user: any) {
    return this.service.createPurchase(dto, user.id);
  }

  @Post('adjust/:productId')
  @Roles(Role.ADMIN, Role.MANAGER)
  adjustStock(
    @Param('productId') productId: string,
    @Body() dto: AdjustDto,
    @CurrentUser() user: any,
  ) {
    return this.service.adjustStock(productId, dto.qty, dto.note || '', user.id);
  }
}

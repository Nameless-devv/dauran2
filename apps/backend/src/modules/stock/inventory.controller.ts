import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsNumber, IsOptional, IsString } from 'class-validator';

class StartInventoryDto {
  @IsString() @IsOptional() note?: string;
}

class UpdateActualQtyDto {
  @IsNumber() actualQty: number;
  @IsString() @IsOptional() note?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.STOREKEEPER)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  getAll() { return this.service.getAll(); }

  @Get('active')
  getActive() { return this.service.getActive(); }

  @Get(':id')
  getOne(@Param('id') id: string) { return this.service.getOne(id); }

  @Post('start')
  start(@Body() dto: StartInventoryDto, @CurrentUser() user: any) {
    return this.service.startInventory(user.id, dto.note);
  }

  @Patch(':inventoryId/items/:productId')
  updateQty(
    @Param('inventoryId') inventoryId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateActualQtyDto,
  ) {
    return this.service.updateActualQty(inventoryId, productId, dto.actualQty, dto.note);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.completeInventory(id, user.id);
  }
}

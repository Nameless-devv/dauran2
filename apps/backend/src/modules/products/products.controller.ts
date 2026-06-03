import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STOREKEEPER)
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  // Barkod bo'yicha qidirish: avval lokal DB, keyin Open Food Facts
  @Get('lookup/:barcode')
  lookup(@Param('barcode') barcode: string) {
    return this.service.lookupByBarcode(barcode);
  }

  // Claude Vision orqali mahsulot rasmini tahlil qilish
  @Post('recognize')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER, Role.STOREKEEPER)
  recognize(@Body() body: { imageBase64: string; mimeType?: string }) {
    return this.service.recognizeByImage(body.imageBase64, body.mimeType);
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.service.findByBarcode(barcode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

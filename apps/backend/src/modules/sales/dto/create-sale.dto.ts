import {
  IsString, IsEnum, IsArray, IsNumber,
  IsOptional, IsPositive, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '../entities/sale.entity';

export class SaleItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @IsPositive()
  qty: number;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;
}

export class CreateSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsNumber()
  @IsPositive()
  paid: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  shiftId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bonusUsed?: number;
}

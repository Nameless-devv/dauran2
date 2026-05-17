import { IsString, IsArray, IsNumber, IsOptional, ValidateNested, IsPositive, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @IsPositive()
  qty: number;

  @IsNumber()
  @IsPositive()
  costPrice: number;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class CreatePurchaseDto {
  @IsString()
  supplierId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}

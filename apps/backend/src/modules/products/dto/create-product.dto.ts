import {
  IsString, IsEnum, IsBoolean, IsNumber,
  IsOptional, IsPositive, Min,
} from 'class-validator';
import { UnitType } from '../entities/product.entity';

export class CreateProductDto {
  @IsString()
  barcode: string;

  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsEnum(UnitType)
  @IsOptional()
  unit?: UnitType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  vatRate?: number;

  @IsBoolean()
  @IsOptional()
  isWeighable?: boolean;

  @IsNumber()
  @IsPositive()
  costPrice: number;

  @IsNumber()
  @IsPositive()
  salePrice: number;
}

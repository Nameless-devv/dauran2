import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  phone: string;

  @IsString()
  name: string;

  @IsDateString()
  @IsOptional()
  birthdate?: string;

  @IsString()
  @IsOptional()
  cardNo?: string;
}

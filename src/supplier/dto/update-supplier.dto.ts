import { PartialType } from '@nestjs/swagger';
import { CreateSupplierDto } from './create-supplier.dto';
import { IsOptional, IsUUID, IsEmail, IsString } from 'class-validator';
import { Country } from '@prisma/client';

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  country?: Country;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}


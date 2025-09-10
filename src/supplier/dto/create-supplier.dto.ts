// src/supplier/dto/create-supplier.dto.ts
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Country, Currency } from '@prisma/client';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  contactName: string;

  @IsString()
  address: string;

  @IsEnum(Country)
  country: Country;

  @IsOptional()
  currency?: Currency[]; // Prisma permite array de enums

  @IsString()
  categoryId: string;

  @IsOptional()
  companyIds?: string[]; // para relacionar con varias compañías
}


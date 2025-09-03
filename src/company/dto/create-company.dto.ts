/* eslint-disable prettier/prettier */

import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Currency } from '@prisma/client'; // usa tu enum de prisma si lo exportas

export class CreateCompanyDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    logoFileId?: string;

    @IsOptional()
    @IsEnum(Currency)
    currency?: Currency;

    @IsOptional()
    @IsString()
    locale?: string;

    @IsOptional()
    @IsString()
    timezone?: string;
}

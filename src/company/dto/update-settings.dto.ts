/* eslint-disable prettier/prettier */
import { IsOptional, IsInt, Min, IsString } from 'class-validator';

export class UpdateSettingsDto {
    @IsOptional()
    @IsInt()
    @Min(0)
    lowStockThreshold?: number;

    @IsOptional()
    @IsString()
    invoicePrefix?: string;

    @IsOptional()
    @IsString()
    themePrimaryColor?: string;
}

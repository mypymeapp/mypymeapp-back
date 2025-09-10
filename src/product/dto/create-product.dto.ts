import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    IsNumber,
    Min,
    IsInt,
} from 'class-validator';

export class CreateProductDto {
    @ApiProperty({ example: 'Notebook Lenovo' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'SKU-12345' })
    @IsString()
    @IsNotEmpty()
    sku: string;

    @ApiProperty({ example: '9876543210', required: false })
    @IsOptional()
    @IsString()
    barcode?: string;

    @ApiProperty({ example: 'Laptop de 15 pulgadas', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 1500.5 })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiProperty({ example: 1000.0, required: false })
    @IsOptional()
    @IsNumber()
    cost?: number;

    @ApiProperty({ example: 'f3c0d5d2-b0f3-4bc1-8b4f-8d6c8f4d1a1c' })
    @IsUUID()
    companyId: string;

    @ApiProperty({ example: '7d5e0a0f-8a7b-4d5a-b123-6c0e7a9f1a2b', required: false })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    qty?: number;

    @ApiProperty({
        example: ['file-uuid-1', 'file-uuid-2'],
        required: false,
        type: [String],
    })
    @IsOptional()
    imageFileIds?: string[];
}

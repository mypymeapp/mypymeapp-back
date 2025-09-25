import {
  IsOptional,
  IsUUID,
  IsDateString,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderProductDto {
  @ApiPropertyOptional({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Quantity of the product' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Order date in ISO format (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    description: 'Invoice number of the order',
    example: 'FAC-2025-0002',
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Supplier ID for the order',
  })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({
    description: 'List of products (if you want to replace them)',
    type: [UpdateOrderProductDto],
  })
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderProductDto)
  @IsOptional()
  products?: UpdateOrderProductDto[];
}


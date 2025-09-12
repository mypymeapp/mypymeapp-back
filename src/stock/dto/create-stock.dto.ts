import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class CreateStockDto {
  @ApiProperty({ example: 'uuid-producto', description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'uuid-company', description: 'Company ID' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ enum: StockMovementType, example: StockMovementType.IN })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({ example: 10, description: 'Units to move' })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ example: 'Supplier order', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: 'invoice', required: false })
  @IsOptional()
  @IsString()
  refType?: string;

  @ApiProperty({ example: 'uuid-invoice', required: false })
  @IsOptional()
  @IsString()
  refId?: string;
}


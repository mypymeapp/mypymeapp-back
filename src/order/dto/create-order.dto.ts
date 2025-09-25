import {
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  ArrayMinSize,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderProductDto {
  @ApiProperty({
    description: 'Unique identifier of the product',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product in the order (must be at least 1)',
    example: 3,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Order date in ISO format (YYYY-MM-DD)',
    example: '2025-09-23',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Invoice number of the order',
    example: 'FAC-2025-0001',
  })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({
    description: 'Unique identifier of the company placing the order',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsUUID()
  companyId: string;

  @ApiProperty({
    description: 'Unique identifier of the supplier for the order',
    example: 'bd4db02a-36f0-4a9f-8c3e-3b740e26458d',
  })
  @IsUUID()
  supplierId: string;

  @ApiProperty({
    description: 'List of products included in the order (at least one)',
    type: [OrderProductDto],
  })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products: OrderProductDto[];
}


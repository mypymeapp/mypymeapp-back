import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid-product' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity of this product', example: 2 })
  @IsInt()
  @Min(1)
  qty: number;
}


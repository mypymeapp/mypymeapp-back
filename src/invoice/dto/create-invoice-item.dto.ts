import { IsString, IsNumber, IsInt, Min } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString()
  productId: string;

  @IsString()
  description: string;

  @IsInt()
  @Min(1)
  qty: number;

  @IsNumber()
  price: number;
}


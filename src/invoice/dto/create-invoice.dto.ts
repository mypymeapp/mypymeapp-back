import {
  IsString,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Invoice number', example: 'INV-001' })
  @IsString()
  number: string;

  @ApiProperty({ description: 'Due date in ISO format', example: '2025-09-30' })
  @IsDateString()
  dueAt: string;

  @ApiProperty({ description: 'Company ID', example: 'uuid-company' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid-customer' })
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'Items included in the invoice (productId + qty)',
    type: [CreateInvoiceItemDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  @ArrayMinSize(1)
  items: CreateInvoiceItemDto[];
}


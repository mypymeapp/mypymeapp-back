import {
  IsString,
  IsDateString,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

export class CreateInvoiceDto {
  @IsString()
  number: string;

  @IsDateString()
  dueAt: Date;

  @IsNumber()
  total: number;

  @IsString()
  companyId: string;

  @IsString()
  customerId: string;

  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  @ArrayMinSize(1)
  items: CreateInvoiceItemDto[];
}


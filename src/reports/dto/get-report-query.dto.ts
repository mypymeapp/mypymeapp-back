import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';

export enum TransactionTypeFilter {
  INVOICE = 'orders',
  ORDER = 'invoices',
}

export class GetReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date', example: '2025-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date', example: '2025-09-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: TransactionTypeFilter,
  })
  @IsOptional()
  @IsEnum(TransactionTypeFilter)
  type?: TransactionTypeFilter;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}


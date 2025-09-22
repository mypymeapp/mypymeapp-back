import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Invoice } from '@prisma/client';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  async create(@Body() dto: CreateInvoiceDto): Promise<Invoice> {
    return this.invoiceService.create(dto);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'List all invoices for a company' })
  @ApiParam({ name: 'companyId', description: 'ID of the company' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async findAll(@Param('companyId') companyId: string): Promise<Invoice[]> {
    return this.invoiceService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiParam({ name: 'id', description: 'ID of the invoice' })
  @ApiResponse({ status: 200, description: 'Invoice found' })
  async findOne(@Param('id') id: string): Promise<Invoice> {
    return this.invoiceService.findOne(id);
  }
}


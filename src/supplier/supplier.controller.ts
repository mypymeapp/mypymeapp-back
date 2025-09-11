import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@ApiTags('Suppliers')
@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @ApiOperation({ summary: 'Create new supplier' })
  @Post()
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.createSupplier(dto);
  }

  @ApiOperation({ summary: 'Get all suppliers' })
  @Get()
  @ApiResponse({ status: 200, description: 'List of suppliers' })
  findAll() {
    return this.supplierService.getAllSuppliers();
  }

  @ApiOperation({ summary: 'Get supplier by id' })
  @Get(':id')
  @ApiResponse({ status: 200, description: 'Supplier details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.supplierService.getSupplierById(id);
  }
}


import { Body, Controller, Post } from '@nestjs/common';
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
}


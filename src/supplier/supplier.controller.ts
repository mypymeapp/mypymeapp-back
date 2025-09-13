import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

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

  @Put(':id')
  @ApiOperation({ summary: 'Update supplier by id' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.supplierService.updateSupplier(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete supplier by id' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.supplierService.deleteSupplier(id);
  }
}


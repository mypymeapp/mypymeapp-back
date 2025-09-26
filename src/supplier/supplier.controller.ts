import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  ConflictException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import csvParser from 'csv-parser';
import streamifier from 'streamifier';
import Papa from 'papaparse';

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

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk upload suppliers from CSV' })
  async bulkUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const csvString = file.buffer.toString('utf-8').trim();
    const lines = csvString
      .split(/\r?\n/)
      .map((line) => line.replace(/^"|"$/g, ''));
    const headers = lines[0].split(',').map((h) => h.trim());
    const dataLines = lines.slice(1);

    const suppliers: CreateSupplierDto[] = [];
    const csvDuplicates: string[] = [];
    const seenEmails = new Set<string>();

    // Detectar duplicados dentro del CSV
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const values = line.split(',').map((v) => v.trim());
      const row: any = {};
      headers.forEach((h, idx) => (row[h] = values[idx]));

      if (seenEmails.has(row.email)) {
        csvDuplicates.push(
          `Fila ${i + 2}: email duplicado en CSV (${row.email})`,
        );
        continue;
      }
      seenEmails.add(row.email);

      suppliers.push({
        name: row.name,
        email: row.email,
        phone: row.phone,
        contactName: row.contactName,
        address: row.address,
        country: row.country,
        categoryId: row.categoryId,
        companyId: row.companyId,
      });
    }

    if (csvDuplicates.length > 0) {
      throw new ConflictException({
        message: 'Duplicados detectados dentro del CSV',
        details: csvDuplicates,
      });
    }

    // Validación contra la base de datos usando el servicio
    const dbDuplicates: string[] = [];
    for (const s of suppliers) {
      try {
        await this.supplierService.createSupplier(s);
      } catch (err) {
        dbDuplicates.push(
          `Supplier duplicado o error: ${s.email} - ${err.message}`,
        );
      }
    }

    if (dbDuplicates.length > 0) {
      throw new ConflictException({
        message: 'Duplicados detectados en la base de datos',
        details: dbDuplicates,
      });
    }

    // Si llegamos hasta aquí, todos los suppliers son válidos
    const createdSuppliers: any[] = [];
    for (const s of suppliers) {
      const created = await this.supplierService.createSupplier(s);
      createdSuppliers.push(created);
    }

    return createdSuppliers;
  }
}


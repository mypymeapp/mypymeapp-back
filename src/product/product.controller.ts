import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Patch,
  UploadedFile,
  UseInterceptors,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { StockService } from 'src/stock/stock.service';
import { CreateStockDto } from 'src/stock/dto/create-stock.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from '../files/files.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stockService: StockService,
    private readonly fileService: FilesService,
  ) {}

  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiOperation({ summary: 'Get all products' })
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @ApiOperation({ summary: 'Get all products + deletedAt — SUPERADMIN only' })
  @Get('all')
  findAllProducts() {
    return this.productsService.findAllProducts();
  }

  @ApiOperation({ summary: 'Get products by id' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update product by id' })
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Soft delete product by id' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  @ApiOperation({ summary: 'Restore a deleted product' })
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return this.productsService.restore(id);
  }

  @ApiOperation({ summary: 'Register a stock movement for a product' })
  @Post(':id/stock')
  async addStockMovement(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() dto: CreateStockDto,
  ) {
    return this.stockService.create({
      ...dto,
      productId,
    });
  }

  @ApiOperation({ summary: 'Listar movimientos de stock de un producto' })
  @Get(':id/stock')
  async getStockMovements(@Param('id', ParseUUIDPipe) productId: string) {
    return this.stockService.findByProduct(productId);
  }

  @ApiOperation({ summary: 'Upload product image' })
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id', ParseUUIDPipe) productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.fileService.uploadProductImage(productId, file);
  }

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk upload products from CSV' })
  async bulkUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const csvString = file.buffer.toString('utf-8').trim();
    const lines = csvString
      .split(/\r?\n/)
      .map((line) => line.replace(/^"|"$/g, ''));

    // Headers del CSV
    const headers = lines[0].split(',').map((h) => h.trim());
    const dataLines = lines.slice(1);

    const products: CreateProductDto[] = [];
    const csvDuplicates: string[] = [];
    const seenSkus = new Set<string>();

    // 1️⃣ Validar duplicados en el propio CSV
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const values = line.split(',').map((v) => v.trim());
      const row: any = {};
      headers.forEach((h, idx) => (row[h] = values[idx]));

      // Si ya vimos este SKU dentro del CSV
      if (seenSkus.has(row.sku)) {
        csvDuplicates.push(`Fila ${i + 2}: SKU duplicado en CSV (${row.sku})`);
        continue;
      }
      seenSkus.add(row.sku);

      // Construir DTO para este producto
      products.push({
        name: row.name,
        sku: row.sku,
        barcode: row.barcode,
        description: row.description,
        price: parseFloat(row.price),
        cost: row.cost ? parseFloat(row.cost) : undefined,
        companyId: row.companyId,
        categoryId: row.categoryId,
        qty: row.qty ? parseInt(row.qty) : undefined,
        imageFileIds: row.imageFileIds
          ? row.imageFileIds.split('|') // ejemplo: "uuid1|uuid2"
          : undefined,
      });
    }

    if (csvDuplicates.length > 0) {
      throw new ConflictException({
        message: 'Duplicados detectados dentro del CSV',
        details: csvDuplicates,
      });
    }

    // 2️⃣ Validar duplicados en la base de datos sin insertar nada
    const dbDuplicates: string[] = [];
    for (const p of products) {
      try {
        // Reutilizamos tu servicio create, pero en modo “check”:
        const skuExists = await this.productsService[
          'prisma'
        ].product.findFirst({
          where: { companyId: p.companyId, sku: p.sku },
        });
        if (skuExists) {
          dbDuplicates.push(
            `SKU '${p.sku}' ya existe en la empresa ${p.companyId}`,
          );
        }
      } catch (err) {
        dbDuplicates.push(`Error verificando SKU ${p.sku}: ${err.message}`);
      }
    }

    if (dbDuplicates.length > 0) {
      throw new ConflictException({
        message: 'Duplicados detectados en la base de datos',
        details: dbDuplicates,
      });
    }

    // 3️⃣ Si llegamos aquí, todos los productos son válidos → insertarlos
    const createdProducts: any[] = [];
    for (const p of products) {
      const created = await this.productsService.create(p);
      createdProducts.push(created);
    }

    return createdProducts;
  }
}


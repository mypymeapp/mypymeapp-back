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
}


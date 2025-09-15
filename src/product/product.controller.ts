import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
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
  @Post()
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiOperation({ summary: 'Get all products' })
  @Get()
  findAll() {
    return this.productsService.findAll();
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

  @ApiOperation({ summary: 'Delete product by id' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/stock')
  @ApiOperation({ summary: 'Register a stock movement for a product' })
  async addStockMovement(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() dto: CreateStockDto,
  ) {
    return this.stockService.create({
      ...dto,
      productId,
    });
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Listar movimientos de stock de un producto' })
  async getStockMovements(@Param('id', ParseUUIDPipe) productId: string) {
    return this.stockService.findByProduct(productId);
  }

  @Post(':id/image')
  @ApiOperation({ summary: 'Upload product image' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id', ParseUUIDPipe) productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.fileService.uploadProductImage(productId, file);
  }
}


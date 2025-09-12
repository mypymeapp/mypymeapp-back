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
import { ProductsService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { StockService } from 'src/stock/stock.service';
import { CreateStockDto } from 'src/stock/dto/create-stock.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stockService: StockService
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
  @ApiOperation({ summary: 'Registrar un movimiento de stock para un producto' })
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
}


import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';

@ApiTags('Stock')
@Controller('stock')
export class StockController {
    constructor(private readonly stockService: StockService) {}

    @Post()
    @ApiOperation({ summary: 'Registrar un movimiento de stock' })
    create(@Body() dto: CreateStockDto) {
        return this.stockService.create(dto);
    }

    @Get(':companyId')
    @ApiOperation({ summary: 'Obtener movimientos de stock de una compañía' })
    findAll(@Param('companyId', ParseUUIDPipe) companyId: string) {
        return this.stockService.findAll(companyId);
    }
}

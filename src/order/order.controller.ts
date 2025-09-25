import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './order.service';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created.' })
  @ApiResponse({ status: 400, description: 'Invalid data.' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by order ID' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order founded.' })
  @ApiResponse({ status: 404, description: 'Order not founded.' })
  findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get('/company/:companyId')
  @ApiOperation({ summary: 'Get orders by company ID' })
  @ApiParam({
    name: 'companyId',
    type: String,
    description: 'Company ID',
  })
  @ApiResponse({ status: 200, description: 'Orders founded.' })
  @ApiResponse({
    status: 404,
    description: 'There are not orders for this company.',
  })
  findByCompany(@Param('companyId') companyId: string) {
    return this.ordersService.findByCompany(companyId);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete order by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order deleted.' })
  delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Order updated.' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }
}


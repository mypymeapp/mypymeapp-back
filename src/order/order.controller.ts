import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ConflictException,
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
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk upload orders from CSV' })
  async bulkUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const csvString = file.buffer.toString('utf-8').trim();
    const lines = csvString
      .split(/\r?\n/)
      .map((line) => line.replace(/^"|"$/g, ''));

    const headers = lines[0].split(',').map((h) => h.trim());
    const dataLines = lines.slice(1);

    // 1️⃣ Agrupar items por (invoiceNumber + companyId) para detectar duplicados
    const ordersMap = new Map<
      string,
      {
        date: string;
        invoiceNumber: string;
        companyId: string;
        supplierId: string;
        products: { productId: string; quantity: number }[];
      }
    >();
    const csvDuplicates: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const values = line.split(',').map((v) => v.trim());
      const row: any = {};
      headers.forEach((h, idx) => (row[h] = values[idx]));

      if (!row.invoiceNumber || !row.companyId) {
        csvDuplicates.push(`Fila ${i + 2}: Falta invoiceNumber o companyId`);
        continue;
      }

      const key = `${row.companyId}-${row.invoiceNumber}`;

      if (!ordersMap.has(key)) {
        ordersMap.set(key, {
          date: row.date,
          invoiceNumber: row.invoiceNumber,
          companyId: row.companyId,
          supplierId: row.supplierId,
          products: [],
        });
      }

      const order = ordersMap.get(key)!;
      order.products.push({
        productId: row.productId,
        quantity: parseInt(row.quantity, 10),
      });
    }

    if (csvDuplicates.length > 0) {
      throw new ConflictException({
        message: 'Errores detectados dentro del CSV',
        details: csvDuplicates,
      });
    }

    // 2️⃣ Validar duplicados en DB por invoiceNumber + companyId
    const dbDuplicates: string[] = [];
    for (const [key, order] of ordersMap) {
      const existing = await this.ordersService['prisma'].order.findFirst({
        where: {
          companyId: order.companyId,
          invoiceNumber: order.invoiceNumber,
        },
      });
      if (existing) {
        dbDuplicates.push(
          `Invoice '${order.invoiceNumber}' ya existe en la empresa ${order.companyId}`,
        );
      }
    }

    if (dbDuplicates.length > 0) {
      throw new ConflictException({
        message: 'Duplicados detectados en la base de datos',
        details: dbDuplicates,
      });
    }

    // 3️⃣ Crear órdenes
    const createdOrders: any[] = [];
    for (const [_, order] of ordersMap) {
      const created = await this.ordersService.create({
        date: order.date,
        invoiceNumber: order.invoiceNumber,
        companyId: order.companyId,
        supplierId: order.supplierId,
        products: order.products,
      });
      createdOrders.push(created);
    }

    return createdOrders;
  }
}


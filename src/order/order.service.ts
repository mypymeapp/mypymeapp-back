import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { StockService } from '../stock/stock.service';
import { StockMovementType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  async create(dto: CreateOrderDto) {
    // Validar supplier pertenece a la company
    const supplierLink = await this.prisma.companySupplier.findUnique({
      where: {
        companyId_supplierId: {
          companyId: dto.companyId,
          supplierId: dto.supplierId,
        },
      },
    });
    if (!supplierLink)
      throw new BadRequestException('El proveedor no pertenece a la empresa');

    // Validar productos
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: dto.products.map((p) => p.productId) },
        companyId: dto.companyId,
      },
    });
    if (products.length !== dto.products.length) {
      throw new BadRequestException(
        'Alguno de los productos no existe o no pertenece a la empresa',
      );
    }

    // Crear la orden y los items en una transacción
    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          date: new Date(dto.date),
          companyId: dto.companyId,
          supplierId: dto.supplierId,
        },
      });

      for (const p of dto.products) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: p.productId,
            quantity: p.quantity,
          },
        });

        // registrar entrada de stock
        await this.stockService.create({
          companyId: dto.companyId,
          productId: p.productId,
          type: StockMovementType.IN,
          qty: p.quantity,
          reason: 'Compra (Order)',
          refType: 'Order',
          refId: createdOrder.id,
        });
      }

      return createdOrder;
    });

    return this.findById(order.id);
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async findByCompany(companyId: string) {
    return this.prisma.order.findMany({
      where: { companyId },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { date: 'desc' },
    });
  }
}


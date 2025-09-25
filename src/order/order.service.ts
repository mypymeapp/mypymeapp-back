import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { StockService } from '../stock/stock.service';
import { StockMovementType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateOrderDto } from './dto/update-order.dto';

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
          invoiceNumber: dto.invoiceNumber,
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

  async delete(id: string) {
    // Validar que existe
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    // Borrar primero los items para no romper la FK
    await this.prisma.orderItem.deleteMany({ where: { orderId: id } });

    // Borrar la orden
    await this.prisma.order.delete({ where: { id } });

    return { message: 'Orden eliminada correctamente' };
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    // Si hay productos nuevos, borramos los items y los recreamos
    if (dto.products && dto.products.length > 0) {
      await this.prisma.orderItem.deleteMany({ where: { orderId: id } });

      for (const p of dto.products) {
        await this.prisma.orderItem.create({
          data: {
            orderId: id,
            productId: p.productId,
            quantity: p.quantity,
          },
        });
      }
    }

    // Actualizar la orden
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        date: dto.date ? new Date(dto.date) : order.date,
        supplierId: dto.supplierId ?? order.supplierId,
        invoiceNumber: dto.invoiceNumber ?? order.invoiceNumber,
      },
    });

    return this.findById(updatedOrder.id);
  }
}


import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementType } from '@prisma/client';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto) {
    // validar company
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    // validar customer
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    // verificar stock antes de crear factura
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || product.companyId !== dto.companyId) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      if (product.qty < item.qty) {
        throw new BadRequestException(`Not enough stock for ${product.name}`);
      }
    }

    // crear factura y movimientos en una transacción
    const invoice = await this.prisma.$transaction(async (tx) => {
      // descontar stock y registrar movimiento
      for (const item of dto.items) {
        // crear movimiento de stock
        await tx.stockMovements.create({
          data: {
            companyId: dto.companyId,
            productId: item.productId,
            qty: item.qty,
            type: StockMovementType.OUT,
            reason: 'Invoice',
            refType: 'Invoice',
            refId: dto.number,
          },
        });

        // actualizar cantidad del producto
        await tx.product.update({
          where: { id: item.productId },
          data: { qty: { decrement: item.qty } },
        });
      }

      // crear la factura con sus items
      const invoice = await tx.invoice.create({
        data: {
          number: dto.number,
          dueAt: dto.dueAt,
          total: dto.total,
          companyId: dto.companyId,
          customerId: dto.customerId,
          items: {
            create: dto.items.map((i) => ({
              productId: i.productId,
              description: i.description,
              qty: i.qty,
              price: i.price,
            })),
          },
        },
        include: { customer: true, items: true },
      });

      return invoice;
    });

    return invoice;
  }

  async findAll(companyId: string) {
    return this.prisma.invoice.findMany({
      where: { companyId },
      include: { customer: true, items: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
}


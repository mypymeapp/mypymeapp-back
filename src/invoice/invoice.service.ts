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

    // traer todos los productos involucrados
    const productsMap = new Map<string, any>();
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || product.companyId !== dto.companyId) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      if (product.qty < item.qty) {
        throw new BadRequestException(
          `No hay stock suficiente para facturar ${product.name}`,
        );
      }
      productsMap.set(item.productId, product);
    }

    // calcular total usando price de cada producto
    const total = dto.items.reduce((acc, item) => {
      const product = productsMap.get(item.productId);
      return acc + product.price * item.qty;
    }, 0);

    // crear factura y movimientos en transacción
    const invoice = await this.prisma.$transaction(async (tx) => {
      // descontar stock
      for (const item of dto.items) {
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

        await tx.product.update({
          where: { id: item.productId },
          data: { qty: { decrement: item.qty } },
        });
      }

      // crear la factura con items (rellenando description y price)
      const invoice = await tx.invoice.create({
        data: {
          number: dto.number,
          dueAt: new Date(dto.dueAt),
          total,
          companyId: dto.companyId,
          customerId: dto.customerId,
          items: {
            create: dto.items.map((i) => {
              const product = productsMap.get(i.productId);
              return {
                productId: i.productId,
                description: product.description ?? product.name,
                qty: i.qty,
                price: product.price,
              };
            }),
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: {
                select: {
                  cost: true,
                },
              },
            },
          },
        },
      });

      return invoice;
    });

    // añadir cost directamente a cada item en la respuesta
    return {
      ...invoice,
      items: invoice.items.map((i) => ({
        ...i,
        cost: i.product.cost,
      })),
    };
  }

  async findAll(companyId: string) {
    return this.prisma.invoice
      .findMany({
        where: { companyId },
        include: {
          customer: true,
          items: {
            include: {
              product: { select: { cost: true } },
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
      })
      .then((invoices) =>
        invoices.map((inv) => ({
          ...inv,
          items: inv.items.map((i) => ({ ...i, cost: i.product.cost })),
        })),
      );
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { cost: true } },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    return {
      ...invoice,
      items: invoice.items.map((i) => ({
        ...i,
        cost: i.product.cost,
      })),
    };
  }
}


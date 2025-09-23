import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  GetReportQueryDto,
  TransactionTypeFilter,
} from './dto/get-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyReport(companyId: string, query: GetReportQueryDto) {
    const { startDate, endDate, type, page = 1, limit = 50 } = query;

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company)
      throw new NotFoundException(`Company with id ${companyId} not found`);

    // Build type filter
    const typeCondition = type ? `WHERE type = '${type}'` : '';

    // Combined query: invoices + orders
    const rawQuery = `
      SELECT date, type, client_or_provider, product, amount FROM (
        -- Invoices
        SELECT i."issuedAt" AS date,
               'invoices' AS type,
               c.name AS client_or_provider,
               p.name AS product,
               ii.price * ii.qty AS amount
        FROM "Invoice" i
        JOIN "Customer" c ON i."customerId" = c.id
        JOIN "InvoiceItem" ii ON ii."invoiceId" = i.id
        JOIN "Product" p ON p.id = ii."productId"
        WHERE i."companyId" = '${companyId}'
        ${startDate ? `AND i."issuedAt" >= '${startDate}'` : ''}
        ${endDate ? `AND i."issuedAt" <= '${endDate}'` : ''}

        UNION ALL

        -- Orders
        SELECT o."createdAt" AS date,
               'orders' AS type,
               s.name AS client_or_provider,
               p.name AS product,
               COALESCE(p.cost,0) * oi.quantity AS amount
        FROM "Order" o
        JOIN "Supplier" s ON o."supplierId" = s.id
        JOIN "OrderItem" oi ON oi."orderId" = o.id
        JOIN "Product" p ON p.id = oi."productId"
        WHERE o."companyId" = '${companyId}'
        ${startDate ? `AND o."createdAt" >= '${startDate}'` : ''}
        ${endDate ? `AND o."createdAt" <= '${endDate}'` : ''}
      ) AS combined
      ${typeCondition}
      ORDER BY date DESC
      OFFSET ${(page - 1) * limit}
      LIMIT ${limit};
    `;

    const data = await this.prisma.$queryRawUnsafe<any[]>(rawQuery);

    // Total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM (
        SELECT i.id FROM "Invoice" i WHERE i."companyId" = '${companyId}'
        ${startDate ? `AND i."issuedAt" >= '${startDate}'` : ''}
        ${endDate ? `AND i."issuedAt" <= '${endDate}'` : ''}
        UNION ALL
        SELECT o.id FROM "Order" o WHERE o."companyId" = '${companyId}'
        ${startDate ? `AND o."createdAt" >= '${startDate}'` : ''}
        ${endDate ? `AND o."createdAt" <= '${endDate}'` : ''}
      ) AS total_count;
    `;

    const countResult =
      await this.prisma.$queryRawUnsafe<{ count: string }[]>(countQuery);
    const total = parseInt(countResult[0]?.count || '0', 10);

    return { total, page, limit, data };
  }
}

//Para obener solo compras o ventas: localhost:5001/reports/c200189f-aa1e-416d-8c6a-3d3d88ca3d9c?type=orders
//Por rango de fechas: GET /reports/c200189f-aa1e-416d-8c6a-3d3d88ca3d9c?startDate=2025-09-01&endDate=2025-09-23
//Paginacion: GET /reports/c200189f-aa1e-416d-8c6a-3d3d88ca3d9c?page=2&limit=20


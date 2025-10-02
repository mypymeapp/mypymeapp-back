import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from 'src/mail/mail.service';
import { startOfDay, endOfDay } from 'date-fns';
import { dailyReportTemplate } from 'src/templates/dailyReport.template';

@Injectable()
export class CronReportsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async sendDailyReports() {
    const fixedRecipients = [
      'gilerme1980@gmail.com',
      'alvaropaggi@gmail.com',
      // 'dantzalazar@gmail.com',
    ];

    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    for (const email of fixedRecipients) {
      try {
        // Obtener usuario + compañía
        const user = await this.prisma.user.findUnique({
          where: { email },
          include: { companies: { include: { company: true } } },
        });

        if (!user || !user.companies || user.companies.length === 0) {
          console.warn(`Usuario no encontrado o sin compañía para el correo: ${email}`);
          continue;
        }

        const company = user.companies[0].company;

        // 🧑‍🤝‍🧑 Miembros nuevos
        const newMembers = await this.prisma.userCompany.findMany({
          where: {
            companyId: company.id,
            createdAt: { gte: start, lte: end },
          },
          include: { user: true },
        });
        const membersNames = newMembers.map(m => m.user.name);

        // 📂 Categorías nuevas
        const newCategories = await this.prisma.category.findMany({
          where: {
            companyId: company.id,
            createdAt: { gte: start, lte: end },
          },
          select: { name: true },
        });
        const categoriesNames = newCategories.map(c => c.name);

        // 📦 Productos nuevos
        const newProducts = await this.prisma.product.findMany({
          where: {
            companyId: company.id,
            createdAt: { gte: start, lte: end },
          },
        });
        const productsNames = newProducts.map(p => p.name);

        // ⚠️ Productos con stock bajo
        const lowStock = await this.prisma.product.findMany({
          where: { companyId: company.id, qty: { lt: 5 } },
          take: 5,
        });

        // 💰 Ventas del día
        const sales = await this.prisma.transaction.findMany({
          where: {
            companyId: company.id,
            status: 'SUCCESS',
            createdAt: { gte: start, lte: end },
          },
        });
        const totalSales = sales.reduce((acc, s) => acc + s.amount, 0) / 100;
        const currency = sales[0]?.currency ?? '';

        // 🧑‍💼 Clientes nuevos
        const customers = await this.prisma.customer.findMany({
          where: {
            companyId: company.id,
            createdAt: { gte: start, lte: end },
          },
          select: { name: true },
        });
        const customerNames = customers.map(c => c.name);

        // 🧾 Facturas emitidas
        const invoices = await this.prisma.invoice.findMany({
          where: {
            companyId: company.id,
            issuedAt: { gte: start, lte: end },
          },
        });

        // 🏭 Proveedores nuevos
        const newSuppliers = await this.prisma.companySupplier.findMany({
          where: {
            companyId: company.id,
            createdAt: { gte: start, lte: end },
          },
          include: { Supplier: { include: { category: true } } },
        });
        const suppliersData = newSuppliers.map(s => ({
          name: s.Supplier.name,
          category: s.Supplier.category?.name || 'Sin categoría',
        }));

        // 📝 HTML extendido
        const html = dailyReportTemplate(
          company.name,
          membersNames,
          categoriesNames,
          productsNames,
          sales.length,
          totalSales,
          currency,
          invoices.length,
          customerNames,
          lowStock.map(p => ({ name: p.name, qty: p.qty })),
          suppliersData,
        );

        // ✉️ Enviar email
        await this.emailService.sendEmail(
          email,
          `📊 Resumen diario ${company.name}`,
          html,
        );

        console.log(`✅ Resumen diario enviado a ${email}`);

      } catch (err) {
        console.error(`❌ Error enviando reporte a ${email}:`, err);
      }
    }
  }

  async sendTestEmail() {
    // 🔹 Datos de prueba
    const companyName = 'Empresa Demo';
    const membersNames = ['Juan Pérez', 'Ana López', 'Carlos Gómez'];
    const categoriesNames = ['Electrónica', 'Hogar', 'Juguetes'];
    const productsNames = ['iPhone 17', 'Collar', 'Producto 8'];
    const lowStock = [
      { name: 'Laptop', qty: 3 },
      { name: 'Monitor', qty: 4 },
    ];
    const salesCount = 5;
    const totalSales = 1250.75;
    const currency = 'USD';
    const invoicesCount = 3;
    const customerNames = ['Pedro Ramírez', 'Lucía Fernández'];
    const suppliersData = [
      { name: 'Proveedor X', category: 'Electrónica' },
      { name: 'Proveedor Y', category: 'Hogar' },
    ];

    // 🔹 Generar HTML usando dailyReportTemplate
    const html = dailyReportTemplate(
      companyName,
      membersNames,
      categoriesNames,
      productsNames,
      salesCount,
      totalSales,
      currency,
      invoicesCount,
      customerNames,
      lowStock,
      suppliersData
    );

    const testRecipients = [
    'alvaropaggi@gmail.com',
    'gilerme1980@gmail.com',
    ];

    let successCount = 0;
    
    for (const email of testRecipients) {
      try {
        await this.emailService.sendEmail(
          email,
          `📧 Test Daily Report - ${companyName}`,
          html,
        );
        console.log(`✅ Email de prueba enviado correctamente a ${email}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Error enviando email de prueba a ${email}:`, err);
        // El bucle continúa aunque uno falle.
      }
    }
    
    // Retornamos un resumen
    if (successCount > 0) {
        return { message: `Email de prueba enviado a ${successCount} de ${testRecipients.length} destinatarios.` };
    } else {
        throw new Error('No se pudo enviar el email de prueba a ningún destinatario.');
    }
  }
}

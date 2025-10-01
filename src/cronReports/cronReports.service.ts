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
    // ✅ Lista de correos específicos que deben recibir el reporte
    const fixedRecipients = [
      'gilerme1980@gmail.com',
      'alvaropaggi@gmail.com',
      // 'dantzalazar@gmail.com',
    ];

    const today = new Date();

    // 1. Iterar sobre cada destinatario fijo
    for (const email of fixedRecipients) {
      try {
        // 2. Buscar al usuario asociado a este correo, incluyendo la(s) compañía(s)
        const user = await this.prisma.user.findUnique({
          where: { email: email },
          include: {
            // ✅ CORRECCIÓN: Usar 'companies' (nombre correcto de la relación en el modelo User)
            companies: {
              include: { company: true },
              // Puedes añadir aquí un 'where' si necesitas, por ejemplo: where: { role: 'OWNER' }
            },
          },
        });

        // 3. Verificar si el usuario existe y tiene una compañía asociada
        if (!user || !user.companies || user.companies.length === 0) {
          console.warn(`Usuario no encontrado o sin compañía asociada para el correo: ${email}`);
          continue; // Saltar al siguiente correo
        }

        // 4. Obtener la compañía asociada al usuario
        const company = user.companies[0].company;

        // 5. Recopilación de datos del reporte para *esta compañía*
        
        // 👥 Miembros nuevos
        const newMembers = await this.prisma.userCompany.findMany({
          where: {
            companyId: company.id,
            createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
          },
          include: { user: true },
        });
        const membersNames = newMembers.map((m) => m.user.name);

        // 📂 Categorías nuevas
        const newCategories = await this.prisma.category.findMany({
          where: {
            companyId: company.id,
            createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
          },
        });
        const categoriesNames = newCategories.map((c) => c.name);

        // 📦 Productos nuevos
        const newProducts = await this.prisma.product.findMany({
          where: {
            companyId: company.id,
            createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
          },
        });
        const productsNames = newProducts.map((p) => p.name);

        // 💰 Ventas del día
        const sales = await this.prisma.transaction.findMany({
          where: {
            companyId: company.id,
            status: 'SUCCESS',
            createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
          },
        });
        const totalSales = sales.reduce((acc, s) => acc + s.amount, 0) / 100;
        const currency = sales[0]?.currency ?? '';

        // 🧑‍🤝‍🧑 Clientes nuevos
        const customers = await this.prisma.customer.findMany({
          where: {
            companyId: company.id,
            createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
          },
        });

        // 🧾 Facturas emitidas
        const invoices = await this.prisma.invoice.findMany({
          where: {
            companyId: company.id,
            issuedAt: { gte: startOfDay(today), lte: endOfDay(today) },
          },
        });

        // ⚠️ Productos con stock bajo
        const lowStock = await this.prisma.product.findMany({
          where: { companyId: company.id, qty: { lt: 5 } },
          take: 5,
        });

        // 6. Generación del HTML
        const html = dailyReportTemplate(
          membersNames,
          categoriesNames,
          productsNames,
          sales.length,
          totalSales,
          currency,
          invoices.length,
          customers.length,
          lowStock
        ) + `
          <div class="content">
            <h2>💰 Ventas del día</h2>
            <p>${sales.length} transacciones (Total: ${totalSales} ${currency})</p>

            <h2>🧾 Facturas emitidas</h2>
            <p>${invoices.length}</p>

            <h2>🧑‍🤝‍🧑 Clientes nuevos</h2>
            <p>${customers.length}</p>

            <h2>⚠️ Productos con stock bajo (&lt; 5)</h2>
            <ul>${lowStock.map(p => `<li>${p.name} - Stock: ${p.qty}</li>`).join('') || '<li>Ninguno</li>'}</ul>
          </div>
        `;

        // 7. Enviar el mail SÓLO al email actual (del bucle)
        await this.emailService.sendEmail(
          email,
          `📊 Resumen diario ${company.name}`,
          html,
        );

      } catch (err) {
        console.error(`Error enviando reporte a ${email}:`, err);
      }
    }
  }

  async sendTestEmail() {
    // Datos de prueba
    const membersNames = ['Juan Pérez', 'Ana López', 'Carlos Gómez'];
    const categoriesNames = ['Decoraciones', 'Tecnología', 'Abrigos'];
    const productsNames = ['iPhone 17', 'Collar', 'Producto 8'];

    const salesCount = 5;
    const totalSales = 1250.75;
    const currency = 'USD';
    const invoicesCount = 3;
    const customersCount = 2;
    const lowStock = [
      { name: 'Laptop', qty: 3 },
      { name: 'Monitor', qty: 4 },
    ];

    // 📝 HTML completo usando el template unificado
    const html = dailyReportTemplate(
      membersNames,
      categoriesNames,
      productsNames,
      salesCount,
      totalSales,
      currency,
      invoicesCount,
      customersCount,
      lowStock
    );

    const myEmail = 'gilerme1980@gmail.com';

    try {
      const info = await this.emailService.sendEmail(
        myEmail,
        '📧 Test Daily Report MyPymeApp',
        html, // Ahora contiene todo el reporte en un solo bloque
      );
      return info;
    } catch (err) {
      console.error('Error enviando email de prueba:', err);
      throw err;
    }
  }
}
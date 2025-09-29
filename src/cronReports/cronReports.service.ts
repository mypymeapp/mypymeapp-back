import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from 'src/mail/mail.service';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class CronReportsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async sendDailyReports() {
    const companies = await this.prisma.company.findMany();

    for (const company of companies) {
      if (!company.mail || !company.mail.includes('@')) {
        console.warn(`Correo inválido para company ${company.name}`);
        continue;
      }

      const today = new Date();

      const newMembers = await this.prisma.userCompany.findMany({
        where: {
          companyId: company.id,
          createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
        },
        include: { user: true },
      });

      const newCategories = await this.prisma.category.findMany({
        where: {
          companyId: company.id,
          createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
        },
      });

      const newProducts = await this.prisma.product.findMany({
        where: {
          companyId: company.id,
          createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
        },
      });

      const sales = await this.prisma.transaction.findMany({
        where: {
          companyId: company.id,
          status: 'SUCCESS',
          createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
        },
      });

      const html = `
            <h2>Resumen diario - ${company.name}</h2>
            <p><b>Miembros nuevos:</b> ${newMembers.length}</p>
            <p><b>Categorías nuevas:</b> ${newCategories.map((c) => c.name).join(', ')}</p>
            <p><b>Productos nuevos:</b></p>
            <ul>
            ${newProducts.map((p) => `<li>${p.name} - $${p.price} (stock: ${p.qty})</li>`).join('')}
            </ul>
            <p><b>Ventas:</b> ${sales.length} transacciones (${sales.reduce((acc, s) => acc + s.amount, 0) / 100} ${sales[0]?.currency ?? ''})</p>
        `;

      try {
        await this.emailService.sendEmail(
          company.mail,
          `Resumen diario ${company.name}`,
          html,
        );
      } catch (err) {
        console.error(`Error enviando reporte a ${company.name}:`, err);
      }
    }
  }

  async sendTestEmail() {
    const today = new Date();

    // Datos mock o primeros registros de tu DB
    const newMembers = await this.prisma.userCompany.findMany({ take: 3 });
    const newCategories = await this.prisma.category.findMany({ take: 3 });
    const newProducts = await this.prisma.product.findMany({ take: 3 });

    const html = `
        <h2>Prueba de envío de correo - MyPymeApp</h2>
        <p><b>Miembros nuevos:</b> ${newMembers.map((m) => m.userId).join(', ')}</p>
        <p><b>Categorías nuevas:</b> ${newCategories.map((c) => c.name).join(', ')}</p>
        <p><b>Productos nuevos:</b> ${newProducts.map((p) => p.name).join(', ')}</p>
        `;

    // Tu correo personal
    const myEmail = 'gilerme1980@gmail.com';

    try {
      const info = await this.emailService.sendEmail(
        myEmail,
        'Prueba de correo MyPymeApp',
        html,
      );
      return info;
    } catch (err) {
      console.error('Error enviando email de prueba:', err);
      throw err;
    }
  }
}


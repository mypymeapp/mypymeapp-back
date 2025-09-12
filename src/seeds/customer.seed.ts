// src/seeds/customer.seed.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerSeed {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const count = await this.prisma.customer.count();
    if (count > 0) {
      console.log(
        'Seed - Customers: already exist, skipping customer seeding.',
      );
      return;
    }

    // Traemos todas las compañías existentes
    const companies = await this.prisma.company.findMany();

    if (!companies.length) {
      console.log(
        '❌ No hay compañías en la BD, no se pueden crear customers.',
      );
      return;
    }

    // Datos base para los clientes
    const customersBase = [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1234567001',
      },
      { name: 'Bob Smith', email: 'bob@example.com', phone: '+1234567002' },
      {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        phone: '+1234567003',
      },
      {
        name: 'Diana Prince',
        email: 'diana@example.com',
        phone: '+1234567004',
      },
      { name: 'Ethan Hunt', email: 'ethan@example.com', phone: '+1234567005' },
    ];

    for (const company of companies) {
      for (const customerBase of customersBase) {
        // Para no tener conflictos de email, agregamos un sufijo de la company
        const emailUnique = customerBase.email.replace('@', `.${company.id}@`);

        await this.prisma.customer.create({
          data: {
            name: customerBase.name,
            email: emailUnique,
            phone: customerBase.phone,
            memberSince: new Date(),
            notes: `Cliente seed de la compañía ${company.name}`,
            companyId: company.id,
          },
        });
      }
      console.log(`✅ 5 customers creados para la compañía '${company.name}'`);
    }

    console.log('✅ Seed de customers completado para todas las compañías.');
  }
}


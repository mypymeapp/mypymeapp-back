// src/seeds/supplier.seed.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { Country } from '@prisma/client';

@Injectable()
export class SupplierSeed {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const count = await this.prisma.supplier.count();
    if (count > 0) {
      console.log(
        'Seed - Suppliers: already exist, skipping suppliers seeding.',
      );
      return;
    }

    // buscamos la primera company
    const company = await this.prisma.company.findFirst();
    if (!company) {
      console.log('❌ No hay compañías, no se pueden crear suppliers.');
      return;
    }

    // buscamos la primera categoría de esa company
    const category = await this.prisma.category.findFirst({
      where: { companyId: company.id },
    });
    if (!category) {
      console.log(
        `❌ No hay categorías en la compañía ${company.name}, no se pueden crear suppliers.`,
      );
      return;
    }

    const suppliersData = [
      {
        name: 'Tech Supplies S.A.',
        email: 'contact1@techsupplies.com',
        phone: '+59812345601',
        contactName: 'Juan Pérez',
        address: 'Calle Falsa 123',
        country: 'URUGUAY',
      },
      {
        name: 'Office Tools Ltd.',
        email: 'contact2@officetools.com',
        phone: '+59812345602',
        contactName: 'María Gómez',
        address: 'Av. Siempre Viva 456',
        country: 'URUGUAY',
      },
      {
        name: 'Gadgets World',
        email: 'contact3@gadgets.com',
        phone: '+59812345603',
        contactName: 'Carlos López',
        address: 'Calle 8 # 1234',
        country: 'URUGUAY',
      },
      {
        name: 'Digital Solutions',
        email: 'contact4@digitalsolutions.com',
        phone: '+59812345604',
        contactName: 'Lucía Fernández',
        address: 'Av. Tech 100',
        country: 'URUGUAY',
      },
      {
        name: 'ElectroGoods',
        email: 'contact5@electrogoods.com',
        phone: '+59812345605',
        contactName: 'Miguel Torres',
        address: 'Calle Comercio 45',
        country: 'URUGUAY',
      },
      {
        name: 'Premium Electronics',
        email: 'contact6@premiumelectronics.com',
        phone: '+59812345606',
        contactName: 'Sofía Díaz',
        address: 'Av. Central 12',
        country: 'URUGUAY',
      },
      {
        name: 'SmartTech Suppliers',
        email: 'contact7@smarttech.com',
        phone: '+59812345607',
        contactName: 'Fernando Ruiz',
        address: 'Calle Industria 78',
        country: 'URUGUAY',
      },
      {
        name: 'Hardware Solutions',
        email: 'contact8@hardwaresolutions.com',
        phone: '+59812345608',
        contactName: 'Paula Morales',
        address: 'Av. Principal 90',
        country: 'URUGUAY',
      },
      {
        name: 'Office Gear',
        email: 'contact9@officegear.com',
        phone: '+59812345609',
        contactName: 'Diego Ramírez',
        address: 'Calle Comercio 33',
        country: 'URUGUAY',
      },
      {
        name: 'Tech Importers',
        email: 'contact10@techimporters.com',
        phone: '+59812345610',
        contactName: 'Valentina Castro',
        address: 'Av. Industrial 7',
        country: 'URUGUAY',
      },
    ];

    for (const supplier of suppliersData) {
      const createdSupplier = await this.prisma.supplier.create({
        data: {
          id: randomUUID(),
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          contactName: supplier.contactName,
          address: supplier.address,
          country: Country[supplier.country as keyof typeof Country], // ✅ mapear string a enum
          category: { connect: { id: category.id } },
          hasDebt: false,
          pendingGoods: false,
          currency: [],
        },
      });

      // asociar a la company
      await this.prisma.companySupplier.create({
        data: {
          id: randomUUID(),
          companyId: company.id,
          supplierId: createdSupplier.id,
        },
      });
    }

    console.log(
      `✅ Seed of ${suppliersData.length} suppliers creado created on company '${company.name}' y category '${category.name}'`,
    );
  }
}


import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductSeed {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const count = await this.prisma.product.count();
    if (count > 0) {
      console.log('Seed - Producs: already exist, skipping products seeding.');
      return;
    }

    // buscamos la primera company
    const company = await this.prisma.company.findFirst();
    if (!company) {
      console.log('❌ No hay compañías, no se pueden crear productos.');
      return;
    }

    // buscamos la primera categoría de esa company
    const category = await this.prisma.category.findFirst({
      where: { companyId: company.id },
    });

    if (!category) {
      console.log(
        `❌ No hay categorías en la compañía ${company.name}, no se pueden crear productos.`,
      );
      return;
    }

    const productsData = [
      { name: 'Laptop Lenovo ThinkPad', sku: 'LEN123', price: 1200, cost: 900 },
      { name: 'Mouse Logitech MX Master', sku: 'LOG456', price: 80, cost: 50 },
      { name: 'Monitor Samsung 24"', sku: 'SAM789', price: 300, cost: 200 },
      {
        name: 'Teclado Mecánico Redragon',
        sku: 'RED101',
        price: 100,
        cost: 70,
      },
      {
        name: 'Auriculares Sony WH-1000XM4',
        sku: 'SON202',
        price: 350,
        cost: 250,
      },
      { name: 'Impresora HP LaserJet', sku: 'HP303', price: 500, cost: 350 },
      { name: 'Tablet Apple iPad Air', sku: 'APL404', price: 700, cost: 550 },
      { name: 'Disco SSD Kingston 1TB', sku: 'KIN505', price: 150, cost: 100 },
      { name: 'Cámara Canon EOS 90D', sku: 'CAN606', price: 1200, cost: 900 },
      {
        name: 'Smartphone Samsung Galaxy S23',
        sku: 'SAM707',
        price: 1000,
        cost: 800,
      },
    ];

    for (const product of productsData) {
      await this.prisma.product.create({
        data: {
          ...product,
          description: product.name, // opcional
          companyId: company.id,
          categoryId: category.id,
        },
      });
    }

    console.log(
      `✅ Seed de ${productsData.length} productos creado en la compañía '${company.name}' y categoría '${category.name}'`,
    );
  }
}


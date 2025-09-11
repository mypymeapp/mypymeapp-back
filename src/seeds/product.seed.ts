// src/seeds/product.seed.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductSeed {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const count = await this.prisma.product.count();
    if (count > 0) {
      console.log('Seed - Products: already exist, skipping products seeding.');
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
      {
        name: 'Laptop Lenovo ThinkPad',
        sku: 'LEN123',
        barcode: '1111111111111',
        description: 'Laptop de uso empresarial',
        price: 1200,
        cost: 900,
        qty: 10,
      },
      {
        name: 'Mouse Logitech MX Master',
        sku: 'LOG456',
        barcode: '2222222222222',
        description: 'Mouse inalámbrico premium',
        price: 80,
        cost: 50,
        qty: 50,
      },
      {
        name: 'Monitor Samsung 24"',
        sku: 'SAM789',
        barcode: '3333333333333',
        description: 'Monitor FHD de 24 pulgadas',
        price: 300,
        cost: 200,
        qty: 20,
      },
      {
        name: 'Teclado Mecánico Redragon',
        sku: 'RED101',
        barcode: '4444444444444',
        description: 'Teclado mecánico retroiluminado',
        price: 100,
        cost: 70,
        qty: 35,
      },
      {
        name: 'Auriculares Sony WH-1000XM4',
        sku: 'SON202',
        barcode: '5555555555555',
        description: 'Auriculares con cancelación de ruido',
        price: 350,
        cost: 250,
        qty: 15,
      },
      {
        name: 'Impresora HP LaserJet',
        sku: 'HP303',
        barcode: '6666666666666',
        description: 'Impresora láser de alta velocidad',
        price: 500,
        cost: 350,
        qty: 8,
      },
      {
        name: 'Tablet Apple iPad Air',
        sku: 'APL404',
        barcode: '7777777777777',
        description: 'iPad Air de última generación',
        price: 700,
        cost: 550,
        qty: 25,
      },
      {
        name: 'Disco SSD Kingston 1TB',
        sku: 'KIN505',
        barcode: '8888888888888',
        description: 'Disco sólido de 1TB Kingston',
        price: 150,
        cost: 100,
        qty: 40,
      },
      {
        name: 'Cámara Canon EOS 90D',
        sku: 'CAN606',
        barcode: '9999999999999',
        description: 'Cámara réflex Canon EOS 90D',
        price: 1200,
        cost: 900,
        qty: 12,
      },
      {
        name: 'Smartphone Samsung Galaxy S23',
        sku: 'SAM707',
        barcode: '1010101010101',
        description: 'Smartphone Samsung Galaxy S23',
        price: 1000,
        cost: 800,
        qty: 30,
      },
    ];

    for (const product of productsData) {
      await this.prisma.product.create({
        data: {
          ...product,
          companyId: company.id,
          categoryId: category.id,
        },
      });
    }

    console.log(
      `✅ Seed of ${productsData.length} products created on company '${company.name}' and category '${category.name}'`,
    );
  }
}


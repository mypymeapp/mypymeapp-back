// src/seeds/category.seed.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategorySeed {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const categoryCount = await this.prisma.category.count();
    if (categoryCount > 0) {
      console.log(
        'Seed - Categories: already exist, skipping category seeding.',
      );
      return;
    }

    // Obtenemos todas las compañías existentes
    const companies = await this.prisma.company.findMany();
    if (companies.length === 0) {
      console.log('No companies found. Run company seed first.');
      return;
    }

    const sampleCategories = [
      'Electrodomésticos',
      'Ropa',
      'Alimentos',
      'Bebidas',
      'Muebles',
      'Herramientas',
      'Juguetes',
      'Tecnología',
      'Cosmética',
      'Deportes',
    ];

    // Asignamos categorías de forma round-robin a las compañías
    let i = 0;
    for (const categoryName of sampleCategories) {
      const company = companies[i % companies.length];

      await this.prisma.category.create({
        data: {
          name: categoryName,
          companyId: company.id,
        },
      });

      i++;
    }

    console.log('✅ Seed of 10 Categories executed');
  }
}


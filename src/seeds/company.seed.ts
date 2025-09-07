// src/seeds/company.seed.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanySeed {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const count = await this.prisma.company.count();
    if (count > 0) {
      console.log('Seed - Companies: already exist, skipping company seeding.');
      return;
    }

    const companiesData = [
      {
        name: 'Tech Solutions',
        mail: 'contact@techsolutions.com',
        password: 'TechPass123!',
        pais: 'USA',
        razonSocial: 'Tech Solutions LLC',
        rut_Cuit: 'US123456789',
        rubroPrincipal: 'Technology',
      },
      {
        name: 'Green Foods',
        mail: 'info@greenfoods.com',
        password: 'Green1234!',
        pais: 'Brazil',
        razonSocial: 'Green Foods SA',
        rut_Cuit: 'BR987654321',
        rubroPrincipal: 'Food Industry',
      },
      {
        name: 'Urban Builders',
        mail: 'contact@urbanbuilders.com',
        password: 'Build123!',
        pais: 'Argentina',
        razonSocial: 'Urban Builders SRL',
        rut_Cuit: 'AR112233445',
        rubroPrincipal: 'Construction',
      },
      {
        name: 'Bright Marketing',
        mail: 'hello@brightmarketing.com',
        password: 'Bright456!',
        pais: 'Spain',
        razonSocial: 'Bright Marketing SL',
        rut_Cuit: 'ES556677889',
        rubroPrincipal: 'Marketing',
      },
      {
        name: 'Aqua Travels',
        mail: 'info@aquatravels.com',
        password: 'Travel789!',
        pais: 'Uruguay',
        razonSocial: 'Aqua Travels SA',
        rut_Cuit: 'UY998877665',
        rubroPrincipal: 'Tourism',
      },
    ];

    for (const company of companiesData) {
      const hashedPassword = await bcrypt.hash(company.password, 10);

      await this.prisma.company.create({
        data: {
          name: company.name,
          mail: company.mail,
          passwordHash: hashedPassword,
          pais: company.pais,
          razonSocial: company.razonSocial,
          rut_Cuit: company.rut_Cuit,
          rubroPrincipal: company.rubroPrincipal,
          settings: { create: {} },
        },
      });
    }

    console.log('✅ Seed of 5 Companies executed');
  }
}


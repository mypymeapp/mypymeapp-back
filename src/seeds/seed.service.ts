// src/seeds/seed.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserSeed } from './user.seed';
import { CompanySeed } from './company.seed';
import { CategorySeed } from './category.seed';
import { ProductSeed } from './product.seed';
import { SupplierSeed } from './supplier.seed';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.runSeeds();
  }

  private async runSeeds() {
    const companySeed = new CompanySeed(this.prisma);
    await companySeed.run();
    const userSeed = new UserSeed(this.prisma);
    await userSeed.run();
    const categorySeed = new CategorySeed(this.prisma);
    await categorySeed.run();
    const productSeed = new ProductSeed(this.prisma);
    await productSeed.run();
    const supplierSeed = new SupplierSeed(this.prisma);
    await supplierSeed.run();
  }
}


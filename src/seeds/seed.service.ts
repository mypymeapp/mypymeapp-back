import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { seedUsers } from './user.seed';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.runSeeds();
  }

  private async runSeeds() {
    await seedUsers(this.prisma);
    // en el futuro: await seedCompanies(this.prisma), etc.
  }
}


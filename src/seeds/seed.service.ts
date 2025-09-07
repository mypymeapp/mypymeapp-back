// src/seeds/seed.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserSeed } from './user.seed';
import { CompanySeed } from './company.seed';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.runSeeds();
  }

  private async runSeeds() {
    const userSeed = new UserSeed(this.prisma);
    await userSeed.run();
    const companySeed = new CompanySeed(this.prisma);
    await companySeed.run();
  }
}


import { Module } from '@nestjs/common';
import { CategoriesService } from './category.service';
import { CategoriesController } from './category.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService],
  exports: [CategoriesService],
})
export class CategoriesModule {}


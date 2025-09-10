import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [StockController],
    providers: [StockService, PrismaService],
    exports: [StockService],
})
export class StockModule {}

import { Module } from '@nestjs/common';

import { StockService } from '../stock/stock.service';
import { OrdersController } from './order.controller';
import { OrdersService } from './order.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, StockService],
})
export class OrdersModule {}


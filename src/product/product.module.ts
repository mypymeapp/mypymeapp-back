import { Module } from '@nestjs/common';
import { ProductsService } from './product.service';
import { ProductsController } from './product.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { StockModule } from 'src/stock/stock.module';

@Module({
    imports: [ StockModule ],
    controllers: [ProductsController],
    providers: [ProductsService, PrismaService],
})
export class ProductsModule {}

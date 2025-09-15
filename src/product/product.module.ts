import { Module } from '@nestjs/common';
import { ProductsService } from './product.service';
import { ProductsController } from './product.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { StockModule } from 'src/stock/stock.module';
import { FilesModule } from 'src/files/files.module';

@Module({
    imports: [ StockModule, FilesModule ],
    controllers: [ProductsController],
    providers: [ProductsService, PrismaService],
    exports: [ProductsService], 
})
export class ProductsModule {}

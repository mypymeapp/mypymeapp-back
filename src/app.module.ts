import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SeedService } from './seeds/seed.service';
import { CategoriesModule } from './category/category.module';
import { ProductsModule } from './product/product.module';
import { SupplierModule } from './supplier/supplier.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    SupplierModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}


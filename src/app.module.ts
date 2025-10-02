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
import { MailModule } from './mail/mail.module';
import { CustomerModule } from './customer/customer.module';
// import { MercadoPagoModule } from './payments/mercadoPago/mercadopago.module';
import { StripeModule } from './payments/stripe/stripe.module';
import { InvoiceModule } from './invoice/invoice.module';
import { OrdersModule } from './order/order.module';
import { ReportsModule } from './reports/reports.module';
import { AiModule } from './IA-Agent/ai.module';
import { CompanyMembersModule } from './company-members/company-members.module';
import { SupportModule } from './support/support.module';
import { CronReportsModule } from './cronReports/cronReports.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    SupplierModule,
    MailModule,
    CustomerModule,
    // MercadoPagoModule,
    StripeModule,
    InvoiceModule,
    OrdersModule,
    ReportsModule,
    AiModule,
    CompanyMembersModule,
    SupportModule,
    CronReportsModule,
    AdminDashboardModule
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}


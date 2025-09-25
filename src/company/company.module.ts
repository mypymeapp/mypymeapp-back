import { forwardRef, Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { PrismaService } from 'prisma/prisma.service';
import { FilesModule } from '../files/files.module';
import { SupplierModule } from 'src/supplier/supplier.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [forwardRef(() => FilesModule), SupplierModule, MailModule],
  controllers: [CompanyController],
  providers: [CompanyService, PrismaService],
  exports: [CompanyService],
})
export class CompanyModule {}


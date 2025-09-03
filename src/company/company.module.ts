/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompaniesController } from './company.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { FilesModule } from '../files/files.module';
// import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    PrismaModule,
    FilesModule,
    // EventEmitterModule.forRoot(), // si no lo tienes ya
  ],
  controllers: [CompaniesController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}

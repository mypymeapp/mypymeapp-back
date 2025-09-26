import { Module } from '@nestjs/common';
import { CronReportsController } from './cronReports.controller';
import { CronReportsService } from './cronReports.service';
import { EmailService } from 'src/mail/mail.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
    controllers: [CronReportsController],
    providers: [CronReportsService, PrismaService, EmailService],
})
export class CronReportsModule {}


import { Controller, Get, Post } from '@nestjs/common';
import { CronReportsService } from './cronReports.service';

@Controller('cron')
export class CronReportsController {
    constructor(private readonly reportsService: CronReportsService) {
        console.log('✅ CronReportsController cargado');
    }

    @Post('daily-report')
    async dailyReport() {
        return this.reportsService.sendDailyReports();
    }

    @Post('test-email')
    async testEmail() {
        console.log('✅ Entrando a /cron/test-email');
        return this.reportsService.sendTestEmail();
    }
}




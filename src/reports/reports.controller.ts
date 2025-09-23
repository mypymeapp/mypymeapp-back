// src/reports/reports.controller.ts
import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GetReportQueryDto } from './dto/get-report-query.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':companyId')
  @ApiOperation({
    summary: 'Get combined purchases and sales report for a company',
  })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async getReport(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() query: GetReportQueryDto,
  ) {
    return this.reportsService.getCompanyReport(companyId, query);
  }
}


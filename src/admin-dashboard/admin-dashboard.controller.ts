import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/dashboard')
@ApiTags('Admin Dashboard')
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-clients')
  @ApiOperation({ summary: 'Get recent clients' })
  async getRecentClients(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.dashboardService.getRecentClients(limitNum);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get activity feed' })
  async getActivityFeed(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getActivityFeed(limitNum);
  }

  @Get('top-plans')
  @ApiOperation({ summary: 'Get top subscription plans' })
  async getTopPlans(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.dashboardService.getTopPlans(limitNum);
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Get sales chart data' })
  async getSalesChartData(@Query('period') period?: 'week' | 'month' | 'year') {
    return this.dashboardService.getSalesChartData(period || 'month');
  }

  @Get('clients-chart')
  @ApiOperation({ summary: 'Get clients chart data' })
  async getClientsChartData(@Query('period') period?: 'week' | 'month' | 'year') {
    return this.dashboardService.getClientsChartData(period || 'month');
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('daily-orders')
  @ApiOperation({ summary: 'Get daily orders' })
  @ApiResponse({ status: 200, description: 'Return daily orders' })
  async getDailyOrders(@Query('date') date: string) {
    return this.analyticsService.getDailyOrders(new Date(date));
  }

  @Get('monthly-orders')
  @ApiOperation({ summary: 'Get monthly orders' })
  @ApiResponse({ status: 200, description: 'Return monthly orders' })
  async getMonthlyOrders(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.analyticsService.getMonthlyOrders(
      parseInt(year),
      parseInt(month),
    );
  }

  @Get('qr-scans')
  @ApiOperation({ summary: 'Get QR code scans' })
  @ApiResponse({ status: 200, description: 'Return QR code scans' })
  async getQRCodeScans(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getQRCodeScans(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('popular-items')
  @ApiOperation({ summary: 'Get popular items' })
  @ApiResponse({ status: 200, description: 'Return popular items' })
  async getPopularItems(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getPopularItems(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('revenue-stats')
  @ApiOperation({ summary: 'Get revenue statistics' })
  @ApiResponse({ status: 200, description: 'Return revenue statistics' })
  async getRevenueStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getRevenueStats(
      new Date(startDate),
      new Date(endDate),
    );
  }
}

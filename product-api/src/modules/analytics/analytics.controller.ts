import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('summary')
  async summary() {
    return await this.svc.summary();
  }

  @Get('top-queries')
  async top(@Query('limit') limit?: string) {
    return {
      items: await this.svc.topQueries(limit ? Number(limit) : 10),
    };
  }

  @Get('daily')
  async daily(@Query('days') days?: string) {
    return { items: await this.svc.daily(days ? Number(days) : 7) };
  }
}

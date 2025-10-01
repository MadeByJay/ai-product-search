import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly svc: SearchService) {}

  @Post('search')
  async search(@Body() body: { query: string; limit?: number }) {
    return this.svc.search(body.query, body.limit ?? 10);
  }

  @Get('similar/:id')
  async similar(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.svc.similar(id, limit ? Number(limit) : 10);
  }
}

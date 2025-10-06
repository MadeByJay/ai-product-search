import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';

@UseInterceptors(CacheInterceptor) // enable caching for this controller
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  /**
   * Cache product detail for 60s.
   * Cache key defaults to method+url; that’s sufficient for this route.
   */
  @CacheTTL(60) // seconds
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.service.getById(id);
  }

  /**
   * Optional: cache similar items for 30s (tune as needed).
   * Includes limit in the key automatically (method+url).
   */
  @CacheTTL(30) // seconds
  @Get(':id/similar')
  async getSimilar(@Param('id') id: string, @Query('limit') limit?: string) {
    const parsed = Number(limit);
    const finalLimit = Number.isFinite(parsed) ? parsed : 12;
    return this.service.getSimilar(id, finalLimit);
  }
}

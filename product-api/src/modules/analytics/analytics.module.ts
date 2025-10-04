import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { DatabaseModule } from '../database/databases.module';
import { AnalyticsRepository } from './repos/analytics.repository';
import { KyselyModule } from '../database/kysely.module';
import { ProductsRepository } from '../search/repos/products.repository';

@Module({
  imports: [DatabaseModule, KyselyModule],
  providers: [AnalyticsService, AnalyticsRepository, ProductsRepository],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule { }

import { Module } from '@nestjs/common';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule, SearchModule],
})
export class AppModule {}

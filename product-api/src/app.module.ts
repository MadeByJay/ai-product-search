import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SearchModule } from './modules/search/search.module';
import { HealthModule } from './modules/health/health.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ProfileModule } from './modules/profile/profile.module';

@Module({
  imports: [HealthModule, SearchModule, AnalyticsModule, ProfileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

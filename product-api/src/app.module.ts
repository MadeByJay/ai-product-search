import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SearchModule } from './modules/search/search.module';
import { HealthModule } from './modules/health/health.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ProfileModule } from './modules/profile/profile.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    HealthModule,
    SearchModule,
    AnalyticsModule,
    ProfileModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

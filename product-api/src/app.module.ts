import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SearchModule } from './modules/search/search.module';
import { HealthModule } from './modules/health/health.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ProfileModule } from './modules/profile/profile.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsModule } from './modules/metrics/metrics.module';
import { ErrorLoggingInterceptor } from './common/interceptors/error-logging.interceptor';

@Module({
  imports: [
    HealthModule,
    SearchModule,
    AnalyticsModule,
    ProfileModule,
    UsersModule,
    ProductsModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ErrorLoggingInterceptor },
  ],
})
export class AppModule {}

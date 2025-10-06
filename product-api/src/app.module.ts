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

@Module({
  imports: [
    HealthModule,
    SearchModule,
    AnalyticsModule,
    ProfileModule,
    UsersModule,
    ProductsModule,
    MetricsModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const keyvStore = new Keyv({
          store: new KeyvRedis(redisUrl),
          namespace: 'app-cache',
        });

        return {
          store: keyvStore,
          ttl: Number(process.env.CACHE_DEFAULT_TTL_MS ?? 60_000), // ms
          max: Number(process.env.CACHE_MAX_ITEMS ?? 2000),
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
  ],
})
export class AppModule {}

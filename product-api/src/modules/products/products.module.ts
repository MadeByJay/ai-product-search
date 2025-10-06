import { Module } from '@nestjs/common';
import { KyselyModule } from '../database/kysely.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './repos/products.repository';
import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

@Module({
  imports: [
    KyselyModule,
    CacheModule.registerAsync({
      isGlobal: false,
      useFactory: async () => {
        const store = new Keyv({
          store: new KeyvRedis(process.env.REDIS_URL!),
          namespace: 'products-cache',
        });
        return {
          store,
          ttl: Number(process.env.CACHE_DEFAULT_TTL_MS ?? 60_000),
        }; // ms
      },
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}

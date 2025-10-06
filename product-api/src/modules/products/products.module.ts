import { Module } from '@nestjs/common';
import { KyselyModule } from '../database/kysely.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './repos/products.repository';

@Module({
  imports: [KyselyModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}

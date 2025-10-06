import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { KyselyModule } from '../database/kysely.module';
import { ProductsRepository } from '../products/repos/products.repository';

@Module({
  imports: [KyselyModule],
  controllers: [SearchController],
  providers: [SearchService, ProductsRepository],
})
export class SearchModule {}

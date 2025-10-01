import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SearchModule } from './modules/search/search.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [HealthModule, SearchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

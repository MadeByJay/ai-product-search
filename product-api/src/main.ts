import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { logger as baseLogger } from './utility/logger';
import { loadEnv } from './utility/config';
import cors from 'cors';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const env = loadEnv();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'] as any,
  });

  app.setGlobalPrefix('api');
  app.use(cors());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(Number(env.API_PORT));

  baseLogger.info(`API listening on http://localhost:${env.API_PORT}`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { logger as baseLogger } from './utility/logger';
import { loadEnv } from './utility/config';
import cors from 'cors';
import { ValidationPipe } from '@nestjs/common';
import { CorrelationIdMiddleware } from './common/http/correlation.middleware';
import { PinoLoggerMiddleware } from './common/http/pino.middleware';
import { MetricsMiddleware } from './common/observability/metrics.middleware';

async function bootstrap() {
  const env = loadEnv();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'] as any,
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  // Correlation IDs, logging, metrics
  app.use(new CorrelationIdMiddleware().use);
  app.use(new PinoLoggerMiddleware().use);
  app.use(new MetricsMiddleware().use);

  app.setGlobalPrefix('api');
  app.use(cors());
  await app.listen(Number(env.API_PORT));

  baseLogger.info(`API listening on http://localhost:${env.API_PORT}`);
}
bootstrap();

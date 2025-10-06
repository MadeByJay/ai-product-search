import { Injectable, NestMiddleware } from '@nestjs/common';
import { httpRequestDuration, httpRequestsTotal } from './metrics';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const start = process.hrtime.bigint();
    const method = (req.method || 'GET').toUpperCase();

    // Use route path if known; fallback to originalUrl to avoid high-cardinality
    function labelPath(): string {
      // If Nest sets a matched route, prefer it (e.g., "/products/:id")
      const route = req?.route?.path || req?.originalUrl || req?.url || '/';
      // Strip query string to reduce cardinality
      return typeof route === 'string' ? route.split('?')[0] : '/';
    }

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const seconds = Number(end - start) / 1e9;
      const status = String(res.statusCode);
      const path = labelPath();

      httpRequestDuration.labels(method, path, status).observe(seconds);
      httpRequestsTotal.labels(method, path, status).inc(1);
    });

    next();
  }
}

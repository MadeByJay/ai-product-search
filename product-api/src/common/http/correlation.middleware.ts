import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const incoming = req.headers['x-correlation-id'];
    const id =
      (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
    req.correlationId = id;
    res.setHeader('x-correlation-id', id);
    next();
  }
}

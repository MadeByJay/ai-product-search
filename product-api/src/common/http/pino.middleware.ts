import { Injectable, NestMiddleware } from '@nestjs/common';
import pino from 'pino';
import pinoHttp from 'pino-http';

@Injectable()
export class PinoLoggerMiddleware implements NestMiddleware {
  private handler: ReturnType<typeof pinoHttp>;

  constructor() {
    const baseLogger = pino({ level: process.env.LOG_LEVEL || 'info' });

    this.handler = pinoHttp({
      logger: baseLogger,

      genReqId(req: any) {
        const id = req.correlationId;
        if (id && !req.id) req.id = id; // keep pino-http's req.id in sync
        return id;
      },

      // Put correlationId at the root level of every log line for easy querying.
      customProps(req: any) {
        return { correlationId: req.correlationId || req.id };
      },

      customSuccessMessage(req, res: any) {
        return `${req.method} ${req.url} ${res.statusCode}`;
      },
      customErrorMessage(req, res, err) {
        return `${req.method} ${req.url} ${res} - ${err.message}`;
      },

      // Keep request/response objects compact but include the id under req.
      serializers: {
        req(req: any) {
          return {
            method: req.method,
            url: req.url,
            id: req.id ?? req.correlationId, // make the request id visible
          };
        },
        res(res: any) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    });

    // IMPORTANT: bind `use` so `this.handler` is available when Express calls it.
    this.use = this.use.bind(this);
  }

  use(req: any, res: any, next: () => void) {
    this.handler(req, res);
    next();
  }
}

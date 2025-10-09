import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Logs error responses (e.g., 400 from ValidationPipe) with pino request logger.
 * Does NOT change the response payload — it rethrows the original error.
 */
@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest() as any; // express Request + pino-http props
    const logger: any = req?.log ?? console;
    const correlationId: string | undefined = req?.correlationId;
    const method: string | undefined = req?.method;
    const path: string | undefined = req?.originalUrl || req?.url;

    return next.handle().pipe(
      catchError((err: unknown) => {
        let status: number | undefined;
        let responseBody: unknown = undefined;

        if (err instanceof HttpException) {
          status = err.getStatus();
          try {
            // This is the body Nest would send by default (e.g., ValidationPipe)
            responseBody = err.getResponse();
          } catch {
            responseBody = undefined;
          }
        }

        const level =
          typeof status === 'number' && status >= 500 ? 'error' : 'warn';

        // Minimal, structured log including the response body
        logger[level](
          {
            correlationId,
            method,
            path,
            status,
            errMessage:
              err instanceof Error ? err.message : String(err ?? 'Error'),
            // WARNING: responseBody may contain user input; redact upstream if needed
            responseBody,
          },
          'HTTP error',
        );

        // Re-throw so Nest handles the response exactly as before
        return throwError(() => err);
      }),
    );
  }
}

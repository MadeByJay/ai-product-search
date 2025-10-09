import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

function redact(input: unknown): unknown {
  // Add any keys to mask
  const SENSITIVE = new Set(['password', 'authorization', 'token', 'secret']);
  if (Array.isArray(input)) return input.map(redact);
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      out[k] = SENSITIVE.has(k.toLowerCase()) ? '***' : redact(v);
    }
    return out;
  }
  return input;
}

function extractValidationDetails(
  ex: unknown,
): Array<{ field?: string; message: string }> | undefined {
  // Nest ValidationPipe typically sets getResponse() -> { statusCode, message: string[] | string, error }
  if (ex instanceof HttpException) {
    const body = ex.getResponse() as any;
    const messages = Array.isArray(body?.message)
      ? body.message
      : body?.message
        ? [body.message]
        : [];
    if (messages.length) {
      return messages.map((m: string) => ({ message: String(m) }));
    }
  }
  return undefined;
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<
      Request & { correlationId?: string; log?: any }
    >();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const correlationId = (req as any).correlationId;
    if (correlationId) res.setHeader('x-correlation-id', correlationId);

    // Build user-safe payload
    const details = extractValidationDetails(exception);
    const payload: Record<string, unknown> = {
      ok: false,
      code: mapStatusToCode(status, exception),
      message: mapStatusToMessage(status, exception),
      details,
      correlationId,
    };

    // Pick logger from pino-http, fallback to console
    const logger: any = (req as any)?.log ?? console;

    // Decide log level (warn for 4xx, error for 5xx)
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    // Build log context
    const ctxLog = {
      method: req.method,
      path: req.originalUrl || req.url,
      status,
      correlationId,
      // request body (redacted)
      body: redact(
        (req as any).rawBody ? (req as any).rawBody.toString() : req.body,
      ),
    };

    // Emit a single structured log line with the error message and stack
    if (exception instanceof Error) {
      const base = { ...ctxLog, errMessage: exception.message };
      if (
        status >= 500 &&
        process.env.NODE_ENV !== 'production' &&
        exception.stack
      ) {
        logger[level]({ ...base, stack: exception.stack }, 'HTTP exception');
      } else {
        logger[level](base, 'HTTP exception');
      }
    } else {
      logger[level](ctxLog, 'HTTP exception (non-Error)');
    }

    // Return sanitized payload
    res.status(status).json(payload);
  }
}

function mapStatusToCode(status: number, ex: unknown): string {
  if (ex instanceof HttpException) {
    if (status === 400 && extractValidationDetails(ex))
      return 'VALIDATION_FAILED';
  }
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return status >= 500 ? 'SERVER_ERROR' : 'ERROR';
  }
}

function mapStatusToMessage(status: number, ex: unknown): string {
  if (ex instanceof HttpException) {
    const body = ex.getResponse() as any;
    if (typeof body?.message === 'string') return body.message;
  }
  switch (status) {
    case 400:
      return 'Invalid request.';
    case 401:
      return 'Unauthorized.';
    case 403:
      return 'Forbidden.';
    case 404:
      return 'Resource not found.';
    default:
      return status >= 500
        ? 'An unexpected error occurred.'
        : 'Request failed.';
  }
}

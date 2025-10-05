import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';

const MAX_SKEW_MS = Number(process.env.INTERNAL_MAX_SKEW_MS ?? 2 * 60 * 1000); // 2 minutes
const SHARED_SECRET = process.env.INTERNAL_SHARED_SECRET;

function sha256Hex(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function hmacHex(secret: string, input: string): string {
  return crypto.createHmac('sha256', secret).update(input).digest('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

@Injectable()
export class InternalProxyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!SHARED_SECRET || SHARED_SECRET.length < 16) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Internal signature not configured');
      } else {
        // In dev, allow through to avoid blocking local experiments
        return true;
      }
    }

    const http = context.switchToHttp();
    const request = http.getRequest<
      Request & { params?: any; rawBody?: any }
    >();
    const headers = (request as any).headers as Record<
      string,
      string | string[] | undefined
    >;

    const signature = (
      headers['x-internal-signature'] as string | undefined
    )?.trim();
    const timestampHeader = (
      headers['x-internal-timestamp'] as string | undefined
    )?.trim();
    const userIdHeader = (
      headers['x-internal-user-id'] as string | undefined
    )?.trim();

    if (!signature || !timestampHeader || !userIdHeader) {
      throw new UnauthorizedException('Missing internal signature headers');
    }

    const timestampMs = Number(timestampHeader);
    if (!Number.isFinite(timestampMs)) {
      throw new UnauthorizedException('Invalid internal timestamp');
    }

    const now = Date.now();
    if (Math.abs(now - timestampMs) > MAX_SKEW_MS) {
      throw new UnauthorizedException('Stale or future-dated internal request');
    }

    // Reconstruct the signing string
    // method and path should be the actual HTTP verb and path that Nest sees
    const method = ((request as any).method || '').toUpperCase();
    // Use originalUrl if available to ensure match with what Next signed
    const path = (request as any).originalUrl || (request as any).url || '';
    // We must hash the raw body in the same way as Next
    // Could capture raw body in a middleware or use sha256Hex(JSON.stringify(req.body))
    const bodyString =
      (request as any).rawBody instanceof Buffer
        ? (request as any).rawBody
        : JSON.stringify((request as any).body ?? '');
    const bodyHash = sha256Hex(bodyString);

    const toSign = `${method}:${path}:${timestampMs}:${userIdHeader}:${bodyHash}`;
    const expected = hmacHex(SHARED_SECRET, toSign);

    if (!timingSafeEqualHex(signature, expected)) {
      throw new UnauthorizedException('Invalid internal signature');
    }

    // Enforce route userId match for profile routes
    const routeUserId = (request as any).params?.userId as string | undefined;
    if (routeUserId && routeUserId !== userIdHeader) {
      throw new ForbiddenException('User mismatch');
    }

    return true;
  }
}

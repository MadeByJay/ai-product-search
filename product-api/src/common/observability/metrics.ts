import {
  Histogram,
  Registry,
  collectDefaultMetrics,
  Counter,
  Gauge,
} from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status_code'] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 3, 5, 8, 13],
});
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status_code'] as const,
});
export const buildInfo = new Gauge({
  name: 'build_info',
  help: 'Build info (static labels)',
  labelNames: ['version', 'commit', 'env'] as const,
});

registry.registerMetric(httpRequestDuration);
registry.registerMetric(httpRequestsTotal);
registry.registerMetric(buildInfo);

// Initialize build labels once (set via env or CI)
buildInfo.set(
  {
    version: process.env.BUILD_VERSION ?? 'dev',
    commit: process.env.BUILD_COMMIT ?? 'local',
    env: process.env.NODE_ENV ?? 'development',
  },
  1,
);

import { Injectable, OnModuleInit } from '@nestjs/common';
import { AnalyticsRepository } from './repos/analytics.repository';

export type SearchEvent = {
  query: string;
  latency_ms: number;
  result_count: number;
};

@Injectable()
export class AnalyticsService implements OnModuleInit {
  constructor(private readonly repo: AnalyticsRepository) {}

  async onModuleInit() {
    // Ensure table(s)/indexes exist; safe to call repeatedly
    await this.repo.init().catch(() => {});
  }

  /** Fire-and-forget writer used by SearchService (do not block response) */
  async recordSearch(ev: SearchEvent): Promise<void> {
    await this.repo.record(ev.query, ev.latency_ms, ev.result_count);
  }

  /** Aggregate KPIs for the dashboard */
  async summary() {
    return this.repo.summary();
  }

  /** Top queries by frequency */
  async topQueries(limit = 10) {
    return this.repo.topQueries(limit);
  }

  /** Daily query counts for last N days (e.g., 7/14/30) */
  async daily(days = 7) {
    return this.repo.daily(days);
  }
}

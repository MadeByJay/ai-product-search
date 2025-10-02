import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

export type SearchEvent = {
  query: string;
  latency_ms: number;
  result_count: number;
};

@Injectable()
export class AnalyticsService {
  private pool = new Pool({ connectionString: process.env.VECTOR_DB_URL });

  constructor() {
    this.init().catch(() => {});
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_search_events(
        id bigserial primary key,
        query text not null,
        latency_ms integer not null,
        result_count integer not null,
        at timestamptz not null default now()
      );
    `);
  }

  async recordSearch(ev: SearchEvent) {
    await this.pool.query(
      `INSERT INTO analytics_search_events(query, latency_ms, result_count) VALUES ($1,$2,$3)`,
      [ev.query, ev.latency_ms, ev.result_count],
    );
  }

  async summary() {
    const totalQ = await this.pool.query(
      `SELECT count(*)::int AS total FROM analytics_search_events`,
    );
    const todayQ = await this.pool.query(
      `SELECT count(*)::int AS today FROM analytics_search_events WHERE at >= now()::date`,
    );
    const avgLat = await this.pool.query(
      `SELECT coalesce(avg(latency_ms),0)::int AS avg_ms FROM analytics_search_events`,
    );
    const avgRes = await this.pool.query(
      `SELECT coalesce(avg(result_count),0)::int AS avg_results FROM analytics_search_events`,
    );
    return {
      total_queries: totalQ.rows[0].total,
      today_queries: todayQ.rows[0].today,
      avg_latency_ms: avgLat.rows[0].avg_ms,
      avg_results: avgRes.rows[0].avg_results,
    };
  }

  async topQueries(limit = 10) {
    const query = await this.pool.query(
      `
      SELECT query, count(*)::int AS hits
      FROM analytics_search_events
      GROUP BY query
      ORDER BY hits DESC
      LIMIT $1
    `,
      [limit],
    );
    return query.rows;
  }

  async daily(days = 7) {
    const query = await this.pool.query(
      `
      SELECT to_char(d::date,'YYYY-MM-DD') AS day,
             coalesce(count(e.id),0)::int AS hits
      FROM generate_series(now()::date - ($1::int-1), now()::date, '1 day') d
      LEFT JOIN analytics_search_events e ON e.at::date = d::date
      GROUP BY d
      ORDER BY d
    `,
      [days],
    );
    return query.rows;
  }
}

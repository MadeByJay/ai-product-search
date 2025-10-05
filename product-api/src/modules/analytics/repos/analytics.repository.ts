import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql, Transaction } from 'kysely';
import { DB } from '../../database/kysely.module';

const KYSELY_DB = 'KYSELY_DB';

@Injectable()
export class AnalyticsRepository {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}

  private q(trx?: Kysely<DB> | Transaction<DB>) {
    return trx ?? this.db;
  }

  // Migration creates tables; keep as no-op
  async init(_trx?: Kysely<DB> | Transaction<DB>) {
    return;
  }

  async record(
    queryText: string,
    latencyMs: number,
    resultCount: number,
    trx?: Kysely<DB> | Transaction<DB>,
  ) {
    await this.q(trx)
      .insertInto('analytics_search_events')
      .values({
        query: queryText,
        latency_ms: latencyMs,
        result_count: resultCount,
        // id and at are optional on insert (thanks to DB types)
      })
      .execute();
  }

  async summary(trx?: Kysely<DB> | Transaction<DB>) {
    const q = this.q(trx);

    const total = await q
      .selectFrom('analytics_search_events')
      .select(sql<number>`count(*)`.as('v'))
      .executeTakeFirst();

    const today = await q
      .selectFrom('analytics_search_events')
      .where(sql<boolean>`at >= now()::date`)
      .select(sql<number>`count(*)`.as('v'))
      .executeTakeFirst();

    const avgMs = await q
      .selectFrom('analytics_search_events')
      .select(sql<number>`coalesce(avg(latency_ms), 0)`.as('v'))
      .executeTakeFirst();

    const avgRes = await q
      .selectFrom('analytics_search_events')
      .select(sql<number>`coalesce(avg(result_count), 0)`.as('v'))
      .executeTakeFirst();

    return {
      total_queries: total?.v ?? 0,
      today_queries: today?.v ?? 0,
      avg_latency_ms: avgMs?.v ?? 0,
      avg_results: avgRes?.v ?? 0,
    };
  }

  async topQueries(limit = 10, trx?: Kysely<DB> | Transaction<DB>) {
    const q = this.q(trx);
    const safe = Math.max(1, Math.min(100, limit));

    // builder WHERE/GROUP BY/ORDER BY; count(*) typed via sql<number>
    const rows = await q
      .selectFrom('analytics_search_events')
      .select(['query', sql<number>`count(*)`.as('hits')])
      .groupBy('query')
      .orderBy('hits', 'desc')
      .limit(safe)
      .execute();

    return rows; // { query: string; hits: number }[]
  }

  async daily(days = 7, trx?: Kysely<DB> | Transaction<DB>) {
    // generate_series is easier as one raw statement,
    // but we still pass only typed/literal params via sql`...`
    const res = await sql<{ day: string; hits: number }[]>`
      SELECT to_char(d::date,'YYYY-MM-DD') AS day,
             coalesce(count(e.id),0)::int AS hits
      FROM generate_series(now()::date - (${days}::int-1), now()::date, '1 day') d
      LEFT JOIN analytics_search_events e ON e.at::date = d::date
      GROUP BY d ORDER BY d
    `.execute(this.q(trx));

    return res.rows;
  }
}

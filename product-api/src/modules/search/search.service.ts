import { Injectable } from '@nestjs/common';
import { PgVectorStore } from '../../utility/pg';
import OpenAI from 'openai';
import { AnalyticsService } from '../analytics/analytics.service';

type Filters = { priceMax?: number; category?: string };

@Injectable()
export class SearchService {
  private store: PgVectorStore = new PgVectorStore(process.env.VECTOR_DB_URL!);
  private openai: OpenAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(private readonly analytics: AnalyticsService) {
    // init in background; in prod we'd inject lifecycle hooks
    this.store.init();
  }

  async search(query: string, limit: number, filters?: Filters) {
    if (!query) return { results: [], error: 'query required' };
    console.log(query);
    const t0 = Date.now();

    const emb = await this.openai.embeddings.create({
      model: process.env.EMBED_MODEL || 'text-embedding-3-small',
      input: query,
    });
    const vec = emb.data[0].embedding as number[];

    // NEW: structured filters
    const results = await this.store.searchWithFilters(
      vec,
      filters ?? {},
      limit,
    );

    const latency = Date.now() - t0;

    this.analytics
      .recordSearch({
        query,
        latency_ms: latency,
        result_count: results.length,
      })
      .catch((err) => {
        console.log(err);
      });

    return { results, meta: { latency_ms: latency, count: results.length } };
  }

  async similar(id: string, limit: number) {
    const results = await this.store.similar(id, limit);
    return { results };
  }
}

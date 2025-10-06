import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ProductsRepository } from '../products/repos/products.repository';

type Filters = { priceMax?: number; category?: string };

@Injectable()
export class SearchService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(private readonly products: ProductsRepository) {}

  async search(
    query: string,
    limit: number,
    filters?: Filters,
    offset: number = 0,
  ) {
    if (!query) return { results: [], error: 'query required' };

    const t0 = Date.now();

    const emb = await this.openai.embeddings.create({
      model: process.env.EMBED_MODEL || 'text-embedding-3-small',
      input: query,
    });

    const vec = emb.data[0].embedding as number[];

    const results = await this.products.searchWithFilters(
      vec,
      filters ?? {},
      limit,
      undefined,
      offset,
    );

    const latency = Date.now() - t0;

    return { results, meta: { latency_ms: latency, count: results.length } };
  }

  async similar(id: string, limit: number) {
    const results = await this.products.similar(id, limit);
    return { results };
  }
}

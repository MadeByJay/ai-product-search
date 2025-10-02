import { Injectable } from '@nestjs/common';
import { PgVectorStore } from '../../utility/pg';
import OpenAI from 'openai';

@Injectable()
export class SearchService {
  private store: PgVectorStore;
  private openai: OpenAI;

  constructor() {
    this.store = new PgVectorStore(process.env.VECTOR_DB_URL!);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // init in background; in prod we'd inject lifecycle hooks
    this.store.init();
  }

  async search(query: string, limit: number) {
    if (!query) return { results: [], error: 'query required' };
    console.log(query);
    const emb = await this.openai.embeddings.create({
      model: process.env.EMBED_MODEL || 'text-embedding-3-small',
      input: query,
    });
    const vec = emb.data[0].embedding as number[];
    const results = await this.store.search(vec, limit);
    return { results };
  }

  async similar(id: string, limit: number) {
    const results = await this.store.similar(id, limit);
    return { results };
  }
}

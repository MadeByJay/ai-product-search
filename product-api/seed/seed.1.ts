import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { PgVectorStore } from '../src/utility/pg';
import { config } from 'dotenv';

async function main() {
  config();
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required');
  if (!process.env.VECTOR_DB_URL) throw new Error('VECTOR_DB_URL required');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const store = new PgVectorStore(process.env.VECTOR_DB_URL!);
  await store.init();

  const dataPath = path.join(process.cwd(), 'data/seed/products.json');
  const items = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as any[];
  for (const p of items) {
    const text = `${p.title}. ${p.description}. Category: ${p.category}. Price: $${p.price}`;
    const emb = await openai.embeddings.create({
      model: process.env.EMBED_MODEL || 'text-embedding-3-small',
      input: text,
    });
    await store.upsertProduct(p, emb.data[0].embedding as number[]);
    console.log('Indexed', p.id);
  }
  console.log('Seed complete.');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

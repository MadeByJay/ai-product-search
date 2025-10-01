import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { PgVectorStore } from '../src/utility/pg';

const DEFAULT_COUNT = Number(process.env.SEED_COUNT || process.argv[2] || 600);
const BATCH = Number(process.env.SEED_BATCH || 100);
const EMB_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small';

// image generation flags
const GENERATE_IMAGES =
  String(process.env.GENERATE_IMAGES || 'false').toLowerCase() === 'true';
const IMAGE_SAMPLE = Number(process.env.IMAGE_SAMPLE || 50);
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gpt-image-1'; // OpenAI image model
// const IMAGE_SIZE = process.env.IMAGE_SIZE || '1024x1024'; // affects cost
const IMAGE_SIZE = '1024x1024'; // affects cost - TODO - turn into enum
const PLACEHOLDER = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;

// retry helpers
type Fn<T> = () => Promise<T>;
async function withRetry<T>(
  fn: Fn<T>,
  label: string,
  max = 3,
  baseMs = 400,
): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const delay =
        baseMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100);
      console.warn(
        `[seed] ${label} failed (attempt ${attempt}/${max}) – retrying in ${delay}ms`,
        e?.status ?? e?.code ?? e?.message ?? e,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  console.error(`[seed] ${label} failed after ${max} attempts`);
  throw lastErr;
}

// product types & vocab
type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
};

const ADJECTIVES = [
  'modern',
  'vintage',
  'industrial',
  'minimalist',
  'sleek',
  'compact',
  'ergonomic',
  'artisan',
  'classic',
  'premium',
  'eco-friendly',
  'lightweight',
  'durable',
  'foldable',
  'portable',
];
const NOUNS = [
  'desk',
  'chair',
  'sofa',
  'bookshelf',
  'table',
  'lamp',
  'stool',
  'cabinet',
  'sideboard',
  'drawer chest',
  'coffee table',
  'dining table',
  'floor lamp',
  'monitor stand',
  'nightstand',
];
const CATEGORIES = [
  'Furniture',
  'Office',
  'Lighting',
  'Decor',
  'Storage',
  'Bedroom',
  'Living Room',
  'Dining',
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeProduct(i: number): Product {
  const adj = rand(ADJECTIVES);
  const noun = rand(NOUNS);
  const category = rand(CATEGORIES);
  const base: Record<string, number> = {
    Furniture: 300,
    Office: 200,
    Lighting: 80,
    Decor: 60,
    Storage: 150,
    Bedroom: 250,
    'Living Room': 280,
    Dining: 320,
  };
  const price = Math.max(
    20,
    Math.round((base[category] || 150) * (0.7 + Math.random() * 0.9)),
  );
  return {
    id: `p${i}`,
    title: `${adj} ${noun}`,
    description: `A ${adj} ${noun} suitable for ${category.toLowerCase()} spaces. Designed for comfort and durability.`,
    price,
    category,
    image_url: '', // will fill later
  };
}

function loadBaseProducts(): Product[] {
  const p = path.join(process.cwd(), 'data/seed/products.json');
  if (!fs.existsSync(p)) return [];
  const base = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return base.map((b: any, idx: number) => ({
    id: String(b.id ?? `base-${idx}`),
    title: String(b.title),
    description: String(b.description),
    price: Number(b.price),
    category: String(b.category || 'General'),
    image_url: b.image_url || '',
  }));
}

function synthesizeCatalog(target: number): Product[] {
  const list: Product[] = [];
  for (let i = 1; i <= target; i++) list.push(makeProduct(i));
  return list;
}

// OpenAI image generation (URL response)
async function generateImageUrl(
  openai: OpenAI,
  prompt: string,
): Promise<string> {
  // Newer SDK supports "images.generate".
  const resp: any = await withRetry(
    () =>
      openai.images.generate({
        model: IMAGE_MODEL,
        prompt,
        size: IMAGE_SIZE,
        response_format: 'url',
      }) as any,
    `image for "${prompt.slice(0, 40)}..."`,
  );

  const url = resp?.data?.[0]?.url;
  if (!url) throw new Error('No image URL returned by OpenAI');
  return url;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required');
  if (!process.env.VECTOR_DB_URL) throw new Error('VECTOR_DB_URL required');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const store = new PgVectorStore(process.env.VECTOR_DB_URL!);
  await store.init();

  const base = loadBaseProducts();
  const remaining = Math.max(0, DEFAULT_COUNT - base.length);
  const synth = synthesizeCatalog(remaining);
  const items: Product[] = [...base, ...synth];

  console.log(
    `[seed] Seeding ${items.length} products (batch=${BATCH}, model=${EMB_MODEL})`,
  );
  console.log(
    `[seed] Image mode: ${GENERATE_IMAGES ? `OpenAI hybrid (sample=${IMAGE_SAMPLE})` : 'placeholders only'}`,
  );

  // 1 - assign images (hybrid or placeholders)
  if (GENERATE_IMAGES) {
    // pick first IMAGE_SAMPLE items for AI images (or randomize)
    const sampleCount = Math.min(IMAGE_SAMPLE, items.length);
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      if (i < sampleCount) {
        const prompt = `${p.title}, high-quality studio product photo, ${p.category.toLowerCase()} context`;
        try {
          p.image_url = await generateImageUrl(openai, prompt);
        } catch (e: any) {
          console.warn(
            `[seed] fallback placeholder for ${p.id} due to image error`,
          );
          p.image_url = PLACEHOLDER(p.id);
        }
      } else {
        p.image_url = PLACEHOLDER(p.id);
      }
    }
  } else {
    for (const p of items) p.image_url = PLACEHOLDER(p.id);
  }

  // 2 - embeddings + upsert (batched)
  for (let i = 0; i < items.length; i += BATCH) {
    const slice = items.slice(i, i + BATCH);
    const texts = slice.map(
      (p) =>
        `${p.title}. ${p.description}. Category: ${p.category}. Price: $${p.price}`,
    );

    const embResp = await withRetry(
      () => openai.embeddings.create({ model: EMB_MODEL, input: texts }),
      `embeddings batch ${i / BATCH + 1}`,
    );

    await Promise.all(
      slice.map((p, j) =>
        withRetry(
          () => store.upsertProduct(p, embResp.data[j].embedding as number[]),
          `upsert ${p.id}`,
          3,
          200,
        ),
      ),
    );

    console.log(
      `[seed] Indexed ${Math.min(i + BATCH, items.length)}/${items.length}`,
    );
  }

  console.log('[seed] Seed complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

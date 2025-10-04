import { Pool } from 'pg';
import { config } from 'dotenv';

async function main() {
  config();
  const url = process.env.VECTOR_DB_URL;
  if (!url) throw new Error('VECTOR_DB_URL is required');
  const pool = new Pool({ connectionString: url });

  try {
    // Extensions
    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    // Core products table (embedding = 1536 dims for text-embedding-3-*)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products(
        id text primary key,
        title text not null,
        description text not null,
        price numeric not null,
        category text,
        image_url text,
        embedding vector(1536)
      );
    `);

    // Optional vector index for ANN (adjust lists for data size)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_embedding_idx
      ON products USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);

    // Filter indexes
    await pool.query(
      `CREATE INDEX IF NOT EXISTS products_price_idx ON products (price);`,
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);`,
    );

    // Analytics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_search_events(
        id bigserial primary key,
        query text not null,
        latency_ms integer not null,
        result_count integer not null,
        at timestamptz not null default now()
      );
    `);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS analytics_at_idx ON analytics_search_events(at);`,
    );

    // Users + Profile tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid primary key,
        email text unique not null,
        name text,
        avatar_url text,
        created_at timestamptz default now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_items (
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        product_id text REFERENCES products(id) ON DELETE CASCADE,
        created_at timestamptz default now(),
        PRIMARY KEY (user_id, product_id)
      );
    `);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS saved_items_user_idx ON saved_items(user_id, created_at DESC);`,
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        default_category text,
        price_max numeric,
        page_limit int,
        theme text,
        updated_at timestamptz default now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id bigserial PRIMARY KEY,
        user_id uuid,
        action text NOT NULL,
        details jsonb,
        at timestamptz DEFAULT now()
      );
    `);

    await pool.query(
      `CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON audit_logs(user_id, at DESC);`,
    );

    // Analyze
    await pool.query(`ANALYZE;`);

    console.log('✅ Migrations applied.');
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

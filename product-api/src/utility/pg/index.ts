import { Pool } from 'pg';

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category?: string;
  image_url?: string;
};

export class PgVectorStore {
  private pool: Pool;
  constructor(url: string) {
    this.pool = new Pool({ connectionString: url });
  }

  async init(): Promise<boolean> {
    // ensure vector extension & table
    await this.pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS products(
        id text primary key,
        title text,
        description text,
        price numeric,
        category text,
        image_url text,
        embedding vector(1536)
      );
    `);

    return true;
  }

  async upsertProduct(p: Product, embedding: number[]): Promise<void> {
    // pgvector expects a literal like: '[0.1,0.2,...]'
    const vectorString = `[${embedding.join(',')}]`;
    await this.pool.query(
      `INSERT INTO products (id,title,description,price,category,image_url,embedding)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET
         title=EXCLUDED.title,
         description=EXCLUDED.description,
         price=EXCLUDED.price,
         category=EXCLUDED.category,
         image_url=EXCLUDED.image_url,
         embedding=EXCLUDED.embedding`,
      [
        p.id,
        p.title,
        p.description,
        p.price,
        p.category,
        p.image_url,
        vectorString,
      ],
    );
  }

  async search(queryEmbedding: number[], limit = 10) {
    const vectorString = `[${queryEmbedding.join(',')}]`;
    const { rows } = await this.pool.query(
      `SELECT id, title, description, price, category, image_url
       FROM products
       ORDER BY embedding <-> $1
       LIMIT $2`,
      [vectorString, limit],
    );
    return rows as Product[];
  }

  async searchWithFilters(
    queryEmbedding: number[],
    filters: { priceMax?: number; category?: string },
    limit = 10,
  ) {
    const vectorString = `[${queryEmbedding.join(',')}]`;
    const params: any[] = [vectorString];
    const where: string[] = [];

    if (filters.priceMax != null) {
      params.push(filters.priceMax);
      where.push(`price <= $${params.length}`);
    }
    if (filters.category) {
      params.push(filters.category);
      where.push(`category = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.push(limit);

    const { rows } = await this.pool.query(
      `
      SELECT id, title, description, price, category, image_url
      FROM products
      ${whereSql}
      ORDER BY embedding <-> $1
      LIMIT $${params.length}
      `,
      params,
    );
    return rows as Product[];
  }

  async similar(id: string, limit = 10) {
    const { rows } = await this.pool.query(
      `SELECT p2.id, p2.title, p2.description, p2.price, p2.category, p2.image_url
       FROM products p1, products p2
       WHERE p1.id = $1 AND p1.id <> p2.id
       ORDER BY p1.embedding <-> p2.embedding
       LIMIT $2`,
      [id, limit],
    );
    return rows as Product[];
  }

  async getSavedItems(userId: string) {
    const { rows } = await this.pool.query(
      `SELECT p.* FROM saved_items s
       JOIN products p ON p.id = s.product_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId],
    );
    return rows;
  }

  async toggleSavedItem(userId: string, productId: string) {
    await this.pool.query(
      `INSERT INTO saved_items(user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id)
       DO DELETE WHERE saved_items.user_id = $1 AND saved_items.product_id = $2`,
      [userId, productId],
    );
  }

  async getPreferences(userId: string) {
    const { rows } = await this.pool.query(
      `SELECT * FROM user_preferences WHERE user_id = $1`,
      [userId],
    );
    return rows[0] || {};
  }

  async updatePreferences(userId: string, prefs: any) {
    const fields = ['default_category', 'price_max', 'page_limit', 'theme'];
    const updates = fields.filter((field) => prefs[field] !== null);

    if (updates.length === 0) return;

    const set = updates.map((field, i) => `${field} = $${i + 2}`).join(', ');
    await this.pool.query(
      `INSERT INTO user_preferences(user_id, ${updates.join(', ')})
       VALUES ($1, ${updates.map((_, i) => `$${i + 2}`).join(', ')})
       ON CONFLICT (user_id)
       DO UPDATE SET ${set}, updated_at = now()`,
      [userId, ...updates.map((field) => prefs[field])],
    );
  }
}

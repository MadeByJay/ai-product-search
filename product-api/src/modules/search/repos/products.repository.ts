import { Inject, Injectable } from '@nestjs/common';
import { Kysely, Transaction, sql } from 'kysely';
import { DB } from '../../database/kysely.module';
import { KYSELY_DB } from 'src/modules/shared/constants';

// TODO - centralize types
export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category?: string | null;
  image_url?: string | null;
};

@Injectable()
export class ProductsRepository {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) { }

  private q(trx?: Kysely<DB> | Transaction<DB>) {
    return trx ?? this.db;
  }

  async upsert(
    p: Product,
    embedding: number[],
    trx?: Kysely<DB> | Transaction<DB>,
  ): Promise<void> {
    const q = this.q(trx);

    // Upsert non-vector columns
    await q
      .insertInto('products')
      .values({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        category: p.category ?? null,
        image_url: p.image_url ?? null,
      })
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          title: p.title,
          description: p.description,
          price: p.price,
          category: p.category ?? null,
          image_url: p.image_url ?? null,
        }),
      )
      .execute();

    // Update vector column via bound cast (no sql.raw placeholders)
    const vectorLiteral = `[${embedding.join(',')}]`;
    const vectorExpr = sql`CAST(${vectorLiteral} AS vector)`;
    await sql`UPDATE products SET embedding = ${vectorExpr} WHERE id = ${p.id}`.execute(
      q,
    );
  }

  async searchWithFilters(
    embedding: number[],
    filters: { priceMax?: number; category?: string },
    limit: number,
    trx?: Kysely<DB> | Transaction<DB>,
  ): Promise<Product[]> {
    const q = this.q(trx);

    const vectorLiteral = `[${embedding.join(',')}]`;
    const vectorExpr = sql`CAST(${vectorLiteral} AS vector)`;
    const safeLimit = clamp(limit, 1, 500);

    let qb = q
      .selectFrom('products')
      .select(['id', 'title', 'description', 'price', 'category', 'image_url']);

    if (filters.priceMax != null) {
      qb = qb.where('price', '<=', filters.priceMax);
    }
    if (filters.category) {
      qb = qb.where('category', '=', filters.category);
    }

    const rows = await qb
      .orderBy(sql`embedding <-> ${vectorExpr}`)
      .limit(safeLimit)
      .execute();

    return rows;
  }

  async similar(
    id: string,
    limit: number,
    trx?: Kysely<DB> | Transaction<DB>,
  ): Promise<Product[]> {
    const q = this.q(trx);
    const safeLimit = clamp(limit, 1, 100);

    const rows = await q
      .selectFrom('products')
      .select(['id', 'title', 'description', 'price', 'category', 'image_url'])
      .where('id', '<>', id)
      .orderBy(
        // reference the target embedding once via a subquery
        sql`embedding <-> (SELECT embedding FROM products WHERE id = ${id} LIMIT 1)`,
      )
      .limit(safeLimit)
      .execute();

    return rows;
  }
}

/** helper to keep limits sane everywhere */
function clamp(n: number, min: number, max: number) {
  const v = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, v));
}

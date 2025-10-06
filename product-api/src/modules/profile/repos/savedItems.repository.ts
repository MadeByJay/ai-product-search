import { Inject, Injectable } from '@nestjs/common';
import { Kysely, Transaction } from 'kysely';
import { DB } from '../../database/kysely.module';
import { KYSELY_DB } from 'src/modules/shared/constants';

@Injectable()
export class SavedItemsRepository {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}
  private q(trx?: Kysely<DB> | Transaction<DB>) {
    return trx ?? this.db;
  }

  async getByUser(userId: string, trx?: Kysely<DB> | Transaction<DB>) {
    return this.q(trx)
      .selectFrom('saved_items as s')
      .innerJoin('products as p', 'p.id', 's.product_id')
      .select([
        'p.id',
        'p.title',
        'p.description',
        'p.price',
        'p.category',
        'p.image_url',
        's.created_at',
      ])
      .where('s.user_id', '=', userId)
      .orderBy('s.created_at', 'desc')
      .execute();
  }

  /**
   * Toggle without numDeletedRows casting:
   *  - If exists -> delete
   *  - Else -> insert
   */
  async toggle(
    userId: string,
    productId: string,
    trx?: Kysely<DB> | Transaction<DB>,
  ) {
    const q = this.q(trx);

    const exists = await q
      .selectFrom('saved_items')
      .select('product_id')
      .where('user_id', '=', userId)
      .where('product_id', '=', productId)
      .executeTakeFirst();

    if (exists) {
      await q
        .deleteFrom('saved_items')
        .where('user_id', '=', userId)
        .where('product_id', '=', productId)
        .execute();
    } else {
      await q
        .insertInto('saved_items')
        .values({ user_id: userId, product_id: productId })
        .execute();
    }
  }

  async getExistingForUser(
    userId: string,
    productIds: string[],
    trx?: Kysely<DB> | Transaction<DB>,
  ): Promise<string[]> {
    if (!productIds.length) return [];
    const rows = await this.q(trx)
      .selectFrom('saved_items')
      .select(['product_id'])
      .where('user_id', '=', userId)
      .where('product_id', 'in', productIds)
      .execute();
    return rows.map((r) => r.product_id);
  }
}

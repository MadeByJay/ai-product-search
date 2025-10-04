import { Inject, Injectable } from '@nestjs/common';
import { Kysely, Transaction } from 'kysely';
import { DB } from '../../database/kysely.module';
import { KYSELY_DB } from 'src/modules/shared/constants';

@Injectable()
export class UserPreferencesRepository {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}
  private q(trx?: Kysely<DB> | Transaction<DB>) {
    return trx ?? this.db;
  }

  async get(userId: string, trx?: Kysely<DB> | Transaction<DB>) {
    return (
      (await this.q(trx)
        .selectFrom('user_preferences')
        .selectAll()
        .where('user_id', '=', userId)
        .executeTakeFirst()) ?? {}
    );
  }

  async upsert(
    userId: string,
    prefs: Partial<{
      default_category: string | null;
      price_max: number | null;
      page_limit: number | null;
      theme: string | null;
    }>,
    trx?: Kysely<DB> | Transaction<DB>,
  ) {
    const q = this.q(trx);
    const row = {
      user_id: userId,
      default_category: prefs.default_category ?? null,
      price_max: prefs.price_max ?? null,
      page_limit: prefs.page_limit ?? null,
      theme: prefs.theme ?? null,
    };

    await q
      .insertInto('user_preferences')
      .values(row)
      .onConflict((oc) =>
        oc.column('user_id').doUpdateSet({
          default_category: row.default_category,
          price_max: row.price_max,
          page_limit: row.page_limit,
          theme: row.theme,
          updated_at: new Date(),
        }),
      )
      .execute();
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { Kysely, Transaction } from 'kysely';
import { DB, KYSELY_DB } from '../../database/kysely.module';

@Injectable()
export class UsersRepository {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}
  private q(trx?: Kysely<DB> | Transaction<DB>) {
    return trx ?? this.db;
  }

  async create(
    user: { id: string; email: string; name?: string; avatar_url?: string },
    trx?: Kysely<DB> | Transaction<DB>,
  ) {
    await this.q(trx)
      .insertInto('users')
      .values({
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        avatar_url: user.avatar_url ?? null,
      })
      .execute();
  }

  async findByEmail(email: string, trx?: Kysely<DB> | Transaction<DB>) {
    return this.q(trx)
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { Kysely, Transaction } from 'kysely';
import { DB } from './kysely.module';
import { KYSELY_DB } from '../shared/constants';

@Injectable()
export class UnitOfWorkKysely {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}

  /** Runs a function inside a transaction. Rolls back on error. */
  async run<T>(fn: (trx: Transaction<DB>) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(async (trx) => fn(trx));
  }
}

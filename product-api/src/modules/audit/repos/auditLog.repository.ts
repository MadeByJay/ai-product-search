import { Inject, Injectable } from '@nestjs/common';
import { Kysely, Transaction } from 'kysely';
import { DB } from '../../database/kysely.module';
import { KYSELY_DB } from '../../shared/constants';

@Injectable()
export class AuditLogRepository {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<DB>) {}
  private q(trx?: Kysely<DB> | Transaction<DB>) {
    return trx ?? this.db;
  }

  async append(
    ev: {
      user_id: string;
      action: string;
      details?: Record<string, unknown> | null;
    },
    trx?: Kysely<DB> | Transaction<DB>,
  ) {
    await this.q(trx)
      .insertInto('audit_logs')
      .values({
        user_id: ev.user_id ?? null,
        action: ev.action,
        details: ev.details ?? null, // can be object or null
        // id & at are optional on insert based on DB types
      })
      .execute();
  }
}

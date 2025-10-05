import { Injectable } from '@nestjs/common';
import { UnitOfWorkKysely } from '../database/uow-kysely';
import { Kysely, Transaction } from 'kysely';
import { DB } from '../database/kysely.module';
import { AuditLogRepository } from '../audit/repos/auditLog.repository';
import { UserPreferencesRepository } from '../profile/repos/userPreferences.repository';
import { randomUUID } from 'crypto';
import { UsersRepository } from './repos/user.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly uow: UnitOfWorkKysely,
    private readonly users: UsersRepository,
    private readonly prefs: UserPreferencesRepository,
    private readonly audit: AuditLogRepository,
  ) {}

  async createUserWithDefaults(dto: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    defaults?: {
      default_category?: string;
      price_max?: number;
      page_limit?: number;
      theme?: string;
    };
  }) {
    return this.uow.run(async (trx: Transaction<DB>) => {
      // Create user
      await trx
        .insertInto('users')
        .values({
          id: dto.id,
          email: dto.email,
          name: dto.name ?? null,
          avatar_url: dto.avatar_url ?? null,
        })
        .execute();

      // Defaults
      if (dto.defaults && Object.keys(dto.defaults).length) {
        await this.prefs.upsert(dto.id, dto.defaults, trx);
      }

      // Audit
      await this.audit.append(
        {
          user_id: dto.id,
          action: 'user_created',
          details: { email: dto.email, with_defaults: !!dto.defaults },
        },
        trx,
      );

      return { id: dto.id, email: dto.email, created: true };
    });
  }

  async syncUser(dto: { email: string; name?: string; avatar_url?: string }) {
    console.log('hey');
    return this.uow.run(async (trx) => {
      const existing = await this.users.findByEmail(dto.email, trx);
      if (existing)
        return { id: existing.id, email: existing.email, name: existing.name };

      const id = randomUUID();
      await this.users.create(
        { id, email: dto.email, name: dto.name, avatar_url: dto.avatar_url },
        trx,
      );
      await this.prefs.upsert(id, {}, trx);
      await this.audit.append(
        { user_id: id, action: 'user_created', details: { email: dto.email } },
        trx,
      );
      return { id, email: dto.email, name: dto.name };
    });
  }
}

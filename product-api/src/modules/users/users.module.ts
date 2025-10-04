import { Module } from '@nestjs/common';
import { KyselyModule } from '../database/kysely.module';
import { UnitOfWorkKysely } from '../database/uow-kysely';
import { UsersService } from './users.service';
import { UserPreferencesRepository } from '../profile/repos/userPreferences.repository';
import { AuditLogRepository } from '../audit/repos/auditLog.repository';

@Module({
  imports: [KyselyModule],
  providers: [
    UnitOfWorkKysely,
    UsersService,
    UserPreferencesRepository,
    AuditLogRepository,
  ],
  exports: [UsersService],
})
export class UsersModule {}

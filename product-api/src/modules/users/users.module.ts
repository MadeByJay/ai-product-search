import { Module } from '@nestjs/common';
import { KyselyModule } from '../database/kysely.module';
import { UnitOfWorkKysely } from '../database/uow-kysely';
import { UsersService } from './users.service';
import { UserPreferencesRepository } from '../profile/repos/userPreferences.repository';
import { AuditLogRepository } from '../audit/repos/auditLog.repository';
import { UsersRepository } from './repos/user.repository';
import { UsersController } from './users.controller';

@Module({
  imports: [KyselyModule],
  controllers: [UsersController],
  providers: [
    UnitOfWorkKysely,
    UsersService,
    UsersRepository,
    UserPreferencesRepository,
    AuditLogRepository,
  ],
  exports: [UsersService],
})
export class UsersModule {}

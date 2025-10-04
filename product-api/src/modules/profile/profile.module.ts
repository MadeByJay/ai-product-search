import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { SavedItemsRepository } from './repos/savedItems.repository';
import { UserPreferencesRepository } from './repos/userPreferences.repository';
import { DatabaseModule } from '../database/databases.module';
import { KyselyModule } from '../database/kysely.module';

@Module({
  imports: [DatabaseModule, KyselyModule],
  providers: [ProfileService, SavedItemsRepository, UserPreferencesRepository],
  controllers: [ProfileController],
})
export class ProfileModule {}

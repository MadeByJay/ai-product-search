import { Injectable } from '@nestjs/common';
import { SavedItemsRepository } from './repos/savedItems.repository';
import { UserPreferencesRepository } from './repos/userPreferences.repository';

@Injectable()
export class ProfileService {
  constructor(
    private readonly savedItems: SavedItemsRepository,
    private readonly userPrefs: UserPreferencesRepository,
  ) {}

  getSavedItems(userId: string) {
    return this.savedItems.getByUser(userId);
  }

  toggleSavedItem(userId: string, productId: string) {
    return this.savedItems.toggle(userId, productId);
  }

  getPreferences(userId: string) {
    return this.userPrefs.get(userId);
  }

  updatePreferences(userId: string, prefs: any) {
    return this.userPrefs.upsert(userId, prefs);
  }
}

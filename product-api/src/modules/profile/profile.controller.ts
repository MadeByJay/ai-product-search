import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly svc: ProfileService) { }

  // For now pass userId as a path param; later wire to NextAuth session
  @Get(':userId/saved')
  getSaved(@Param('userId') userId: string) {
    return this.svc.getSavedItems(userId);
  }

  @Post(':userId/saved')
  toggleSaved(
    @Param('userId') userId: string,
    @Body() body: { productId: string },
  ) {
    return this.svc.toggleSavedItem(userId, body.productId);
  }

  @Get(':userId/preferences')
  getPrefs(@Param('userId') userId: string) {
    return this.svc.getPreferences(userId);
  }

  @Post(':userId/preferences')
  updatePrefs(@Param('userId') userId: string, @Body() prefs: any) {
    return this.svc.updatePreferences(userId, prefs);
  }
}

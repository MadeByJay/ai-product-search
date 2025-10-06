import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ToggleSavedDto } from './dto/toggle-saved.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { InternalProxyGuard } from 'src/common/guards/internal.proxy.guard';

@UseGuards(InternalProxyGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly svc: ProfileService) {}

  // For now pass userId as a path param
  // TODO - wire to NextAuth session
  @Get(':userId/saved')
  getSaved(@Param('userId') userId: string) {
    return this.svc.getSavedItems(userId);
  }

  @Post(':userId/saved')
  toggleSaved(@Param('userId') userId: string, @Body() body: ToggleSavedDto) {
    return this.svc.toggleSavedItem(userId, body.productId);
  }

  @Get(':userId/preferences')
  getPrefs(@Param('userId') userId: string) {
    return this.svc.getPreferences(userId);
  }

  @Post(':userId/preferences')
  updatePrefs(
    @Param('userId') userId: string,
    @Body() prefs: UpdatePreferencesDto,
  ) {
    return this.svc.updatePreferences(userId, prefs);
  }

  /**
   * GET /profile/:userId/saved/check?ids=a,b,c
   * Returns { saved: ["a","c"] }
   */
  @Get(':userId/saved/check')
  async checkSaved(
    @Param('userId') userId: string,
    @Query('ids') idsParam?: string,
  ) {
    const ids = (idsParam || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const saved = await this.svc.checkSaved(userId, ids);
    return { saved };
  }
}

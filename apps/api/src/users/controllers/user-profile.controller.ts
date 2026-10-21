import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard.js';
import { AccountStatusGuard } from '../../auth/guards/account-status.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { UsersService } from '../users.service.js';
import { UpdateProfileDto } from '../dto/update-profile.dto.js';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto.js';

@Controller('users')
@UseGuards(ClerkAuthGuard, AccountStatusGuard)
export class UserProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, user.clerkUserId, body);
  }

  @Get('notification-preferences')
  async getNotificationPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getNotificationPreferences(user.id);
  }

  @Patch('notification-preferences')
  async updateNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updateNotificationPreferences(user.id, body);
  }

  @Get('sessions')
  async getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getActiveSessions(user.id, user.clerkUserId);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Param('sessionId') sessionId: string) {
    return this.usersService.revokeSession(sessionId);
  }
}

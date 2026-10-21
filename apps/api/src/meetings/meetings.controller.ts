import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { MeetingsService } from './services/meetings.service.js';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard.js';
import { AccountStatusGuard } from '../auth/guards/account-status.guard.js';
import { ProjectAccessGuard } from '../auth/guards/project-access.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller()
@UseGuards(ClerkAuthGuard, AccountStatusGuard)
export class MeetingsController {
  constructor(private meetingsService: MeetingsService) {}

  @Post('projects/:projectId/meetings/booking-token')
  @UseGuards(ProjectAccessGuard)
  async getBookingToken(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.generateBookingToken(projectId, user);
  }

  @Post('meetings/token')
  async getGeneralBookingToken(@CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.generateBookingToken('general', user);
  }

  @Get('projects/:projectId/meetings')
  @UseGuards(ProjectAccessGuard)
  async getProjectMeetings(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.getProjectMeetings(projectId, user);
  }

  @Get('meetings/event-types')
  async getEventTypes() {
    return this.meetingsService.getEventTypes();
  }

  @Get('meetings')
  async getClientMeetings(@CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.getClientMeetings(user);
  }
}

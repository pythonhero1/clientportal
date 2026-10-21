import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CalendarService } from './services/calendar.service.js';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard.js';
import { AccountStatusGuard } from '../auth/guards/account-status.guard.js';
import { ProjectAccessGuard } from '../auth/guards/project-access.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller('projects/:projectId/calendar')
@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get()
  async getProjectCalendar(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.calendarService.getProjectCalendar(projectId, user, month, year);
  }
}

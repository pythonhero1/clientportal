import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CalendarService } from '../services/calendar.service.js';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { OwnerMfaGuard } from '../../auth/guards/owner-mfa.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

@Controller('admin/calendar')
@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)
@Roles('Owner')
export class OwnerCalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get()
  async getOwnerCalendar(@Query('projectId') projectId?: string) {
    return this.calendarService.getOwnerCalendar(projectId);
  }
}

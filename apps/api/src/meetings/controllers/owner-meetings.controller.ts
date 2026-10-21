import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MeetingsService } from '../services/meetings.service.js';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { OwnerMfaGuard } from '../../auth/guards/owner-mfa.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UpdateMeetingDto } from '../dto/update-meeting.dto.js';
import { MeetingStatus } from '@prisma/client';

@Controller('admin/meetings')
@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)
@Roles('Owner')
export class OwnerMeetingsController {
  constructor(private meetingsService: MeetingsService) {}

  @Get()
  async getAllMeetings(
    @Query('projectId') projectId?: string,
    @Query('status') status?: MeetingStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.meetingsService.getAllMeetingsForOwner({
      projectId,
      status,
      from,
      to,
    });
  }

  @Patch(':meetingId')
  async updateMeeting(
    @Param('meetingId') meetingId: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetingsService.updateMeetingForOwner(meetingId, dto);
  }
}

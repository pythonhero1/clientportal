import { MeetingStatus } from '@prisma/client';

export class UpdateMeetingDto {
  projectId?: string;
  description?: string;
  status?: MeetingStatus;
}

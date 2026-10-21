import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller.js';
import { OwnerMeetingsController } from './controllers/owner-meetings.controller.js';
import { MeetingsService } from './services/meetings.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MeetingsController, OwnerMeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}

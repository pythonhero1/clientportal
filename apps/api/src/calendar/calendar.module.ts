import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller.js';
import { OwnerCalendarController } from './controllers/owner-calendar.controller.js';
import { CalendarService } from './services/calendar.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CalendarController, OwnerCalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SupportController } from './controllers/support.controller.js';
import { OwnerSupportController } from './controllers/owner-support.controller.js';
import { TicketsService } from './services/tickets.service.js';
import { HelpService } from './services/help.service.js';
import { TicketAccessGuard } from './guards/ticket-access.guard.js';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [SupportController, OwnerSupportController],
  providers: [TicketsService, HelpService, TicketAccessGuard],
  exports: [TicketsService, HelpService],
})
export class SupportModule {}

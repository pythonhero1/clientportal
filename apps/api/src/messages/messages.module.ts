import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { MessagesController } from './messages.controller.js';
import { OwnerMessagesController } from './controllers/owner-messages.controller.js';
import { MessagesGateway } from './messages.gateway.js';
import { ConversationsService } from './services/conversations.service.js';
import { MessagesService } from './services/messages.service.js';
import { WsClerkAuthGuard } from './guards/ws-clerk-auth.guard.js';
import { ConversationAccessGuard } from './guards/conversation-access.guard.js';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [MessagesController, OwnerMessagesController],
  providers: [
    MessagesGateway,
    ConversationsService,
    MessagesService,
    WsClerkAuthGuard,
    ConversationAccessGuard,
  ],
  exports: [
    ConversationsService,
    MessagesService,
    MessagesGateway,
  ],
})
export class MessagesModule {}

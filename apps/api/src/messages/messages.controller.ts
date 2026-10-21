import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard.js';
import { AccountStatusGuard } from '../auth/guards/account-status.guard.js';
import { ConversationAccessGuard } from './guards/conversation-access.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { ConversationsService } from './services/conversations.service.js';
import { MessagesService } from './services/messages.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { SyncReconnectDto } from './dto/sync-reconnect.dto.js';

@Controller('conversations')
@UseGuards(ClerkAuthGuard, AccountStatusGuard)
export class MessagesController {
  constructor(
    private conversationsService: ConversationsService,
    private messagesService: MessagesService,
  ) {}

  @Get()
  async getConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.getConversationsForUser(user);
  }

  @Get(':id')
  @UseGuards(ConversationAccessGuard)
  async getConversationById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.getConversationById(id, user);
  }

  @Get(':id/messages')
  @UseGuards(ConversationAccessGuard)
  async getMessages(
    @Param('id') id: string,
    @Query('cursor') cursor: string | undefined,
    @Query('limit') limitStr: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    return this.messagesService.getMessages(id, user, cursor, limit);
  }

  @Post(':id/messages')
  @UseGuards(ConversationAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagesService.sendMessage(id, dto, user);
  }

  @Get(':id/sync')
  @UseGuards(ConversationAccessGuard)
  async syncReconnect(
    @Param('id') id: string,
    @Query('since') since: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagesService.syncReconnect(id, since, user);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard.js';
import { AccountStatusGuard } from '../auth/guards/account-status.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { NotificationsService } from './services/notifications.service.js';
import { WebPushService } from './services/web-push.service.js';
import { NotificationFilterDto } from './dto/notification-filter.dto.js';
import { SubscribePushDto } from './dto/subscribe-push.dto.js';
import { UnsubscribePushDto } from './dto/unsubscribe-push.dto.js';

@Controller('notifications')
@UseGuards(ClerkAuthGuard, AccountStatusGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly webPushService: WebPushService,
  ) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: NotificationFilterDto,
  ) {
    return this.notificationsService.getUserNotifications(user.id, filter);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Get('push/public-key')
  getPublicKey() {
    return {
      publicKey: this.webPushService.getPublicKey(),
    };
  }

  @Post('push/subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribePush(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SubscribePushDto,
  ) {
    return this.notificationsService.subscribePush(user.id, body);
  }

  @Post('push/unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribePush(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UnsubscribePushDto,
  ) {
    return this.notificationsService.unsubscribePush(user.id, body.endpoint);
  }
}

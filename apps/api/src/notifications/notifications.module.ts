import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './services/notifications.service.js';
import { WebPushService } from './services/web-push.service.js';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, WebPushService],
  exports: [NotificationsService, WebPushService],
})
export class NotificationsModule {}

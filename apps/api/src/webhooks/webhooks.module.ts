import { Module } from '@nestjs/common';
import { ClerkWebhookController } from './clerk-webhook.controller.js';
import { ClerkWebhookService } from './clerk-webhook.service.js';
import { CalComWebhookController } from './calcom-webhook.controller.js';
import { CalComWebhookService } from './calcom-webhook.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ClerkWebhookController, CalComWebhookController],
  providers: [ClerkWebhookService, CalComWebhookService],
  exports: [ClerkWebhookService, CalComWebhookService],
})
export class WebhooksModule {}


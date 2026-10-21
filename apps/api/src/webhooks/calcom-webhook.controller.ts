import { Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { CalComWebhookService } from './calcom-webhook.service.js';

@Controller('webhooks')
export class CalComWebhookController {
  constructor(private webhookService: CalComWebhookService) {}

  @Post('calcom')
  @HttpCode(HttpStatus.OK)
  async handleCalComWebhook(@Req() req: any, @Headers() headers: Record<string, string>) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    return this.webhookService.processWebhook(rawBody, headers);
  }
}

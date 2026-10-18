import { Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ClerkWebhookService } from './clerk-webhook.service.js';

@Controller('webhooks')
export class ClerkWebhookController {
  constructor(private webhookService: ClerkWebhookService) {}

  @Post('clerk')
  @HttpCode(HttpStatus.OK)
  async handleClerkWebhook(@Req() req: any, @Headers() headers: Record<string, string>) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    return this.webhookService.processWebhook(rawBody, headers);
  }
}

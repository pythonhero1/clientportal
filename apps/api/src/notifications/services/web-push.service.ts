import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface GenericPushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);
  private publicKey: string | null = null;
  private isConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT') || 'mailto:stephen@oderindestephen.com';

    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.publicKey = publicKey;
        this.isConfigured = true;
        this.logger.log('Web Push initialized with configured VAPID keypair.');
      } catch (err) {
        this.logger.warn(`Failed to initialize VAPID details: ${err}`);
      }
    } else {
      this.logger.warn('VAPID keys not fully configured. Web Push over-the-air delivery is inactive.');
    }
  }

  getPublicKey(): string | null {
    return this.publicKey;
  }

  async sendGenericPush(userId: string, payload: GenericPushPayload): Promise<void> {
    if (!this.isConfigured || !process.env.DATABASE_URL) {
      this.logger.debug(`Skipping push to user ${userId} (WebPush inactive or DB disabled).`);
      return;
    }

    try {
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId },
      });

      if (!subscriptions.length) {
        return;
      }

      // Lock-screen data minimization: Generic payload only
      const pushString = JSON.stringify({
        title: payload.title || 'Oderinde Stephen Portal',
        body: payload.body || 'You have a new update in your portal.',
        url: payload.url || '/notifications',
        tag: payload.tag || 'general-notification',
      });

      const promises = subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, pushString);
        } catch (error: any) {
          const statusCode = error?.statusCode || error?.status;
          // Auto-prune on 404 or 410 Gone / expired subscriptions
          if (statusCode === 404 || statusCode === 410 || error?.name === 'WebPushError') {
            this.logger.warn(`Push subscription expired/invalid (${statusCode}) for endpoint ${sub.endpoint}. Pruning...`);
            await this.prisma.pushSubscription.deleteMany({
              where: { endpoint: sub.endpoint },
            }).catch((pruneErr) => {
              this.logger.error(`Failed to prune expired subscription: ${pruneErr.message}`);
            });
          } else {
            this.logger.error(`Error sending push to endpoint ${sub.endpoint}: ${error?.message || error}`);
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (err: any) {
      this.logger.error(`Failed to dispatch push notifications for user ${userId}: ${err.message}`);
    }
  }
}

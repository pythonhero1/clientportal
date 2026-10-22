import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { WebPushService } from './web-push.service.js';
import { CreateNotificationDto } from '../dto/create-notification.dto.js';
import { NotificationFilterDto } from '../dto/notification-filter.dto.js';
import { SubscribePushDto } from '../dto/subscribe-push.dto.js';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webPushService: WebPushService,
  ) {}

  async createNotification(userId: string, dto: CreateNotificationDto) {
    if (!process.env.DATABASE_URL) {
      return {
        id: 'mock_notif_' + Date.now(),
        userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        link: dto.link,
        isRead: false,
        createdAt: new Date(),
      };
    }

    // 1. Check user notification preferences
    const preferences = await this.prisma.userNotificationPreferences.findUnique({
      where: { userId },
    });

    const isDeliverable = (
      [
        NotificationType.FILE_DELIVERABLE_UPLOADED,
        NotificationType.FILE_CHANGES_REQUESTED,
        NotificationType.FILE_APPROVED,
      ] as any[]
    ).includes(dto.type);

    const isMessage = dto.type === NotificationType.MESSAGE_RECEIVED;
    const isInvoice = (
      [NotificationType.INVOICE_ISSUED, NotificationType.PAYMENT_CONFIRMED] as any[]
    ).includes(dto.type);
    const isMilestone = dto.type === NotificationType.MILESTONE_UPDATED;
    const isMeeting = dto.type === NotificationType.MEETING_SCHEDULED;
    const isSupport = (
      [
        NotificationType.SUPPORT_TICKET_REPLIED,
        NotificationType.SUPPORT_TICKET_RESOLVED,
      ] as any[]
    ).includes(dto.type);

    let allowInApp = true;
    let allowPush = preferences?.pushEnabled ?? false;

    if (preferences) {
      if (isDeliverable) {
        allowInApp = preferences.inAppDeliverables;
        allowPush = allowPush && preferences.pushDeliverables;
      } else if (isMessage) {
        allowInApp = preferences.inAppMessages;
        allowPush = allowPush && preferences.pushMessages;
      } else if (isInvoice) {
        allowInApp = preferences.inAppInvoices;
        allowPush = allowPush && preferences.pushInvoices;
      } else if (isMilestone) {
        allowInApp = preferences.inAppMilestones;
        allowPush = allowPush && preferences.pushMilestones;
      } else if (isMeeting) {
        allowInApp = preferences.inAppMeetings;
        allowPush = allowPush && preferences.pushMeetings;
      } else if (isSupport) {
        allowInApp = preferences.inAppSupport;
        allowPush = allowPush && preferences.pushSupport;
      }
    }

    let notification: any = null;

    if (allowInApp) {
      notification = await this.prisma.notification.create({
        data: {
          userId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          link: dto.link,
          data: dto.data ? (dto.data as any) : undefined,
        },
      });
    }

    // 2. Dispatch generic push notification if push is allowed
    if (allowPush) {
      const genericBody = this.getGenericPushBody(dto.type);
      await this.webPushService.sendGenericPush(userId, {
        title: 'Oderinde Stephen Portal',
        body: genericBody,
        url: dto.link || '/notifications',
        tag: `notif-${dto.type.toLowerCase()}`,
      });
    }

    return notification;
  }

  async createNotificationForOwner(dto: CreateNotificationDto) {
    if (!process.env.DATABASE_URL) {
      return this.createNotification('owner_default', dto);
    }

    const adminEmail = (
      process.env.ADMIN_EMAIL ||
      process.env.OWNER_EMAIL ||
      'stephenoderinde@gmail.com'
    ).toLowerCase();

    const owner = await this.prisma.user.findFirst({
      where: {
        OR: [{ role: 'Owner' }, { email: adminEmail }],
      },
    });

    if (!owner) {
      this.logger.warn('No user with Owner role or admin email found to receive Owner alert.');
      return null;
    }

    return this.createNotification(owner.id, dto);
  }

  async getUserNotifications(userId: string, filter: NotificationFilterDto) {
    if (!process.env.DATABASE_URL) {
      return {
        items: [],
        total: 0,
        unreadCount: 0,
      };
    }

    const where: any = { userId };
    if (filter.isRead !== undefined) {
      where.isRead = filter.isRead;
    }
    if (filter.type) {
      where.type = filter.type;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit || 20,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items,
      total,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    if (!process.env.DATABASE_URL) {
      return { unreadCount: 0 };
    }

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { unreadCount };
  }

  async markAsRead(userId: string, notificationId: string) {
    if (!process.env.DATABASE_URL) {
      return { id: notificationId, isRead: true, readAt: new Date() };
    }

    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found.');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    if (!process.env.DATABASE_URL) {
      return { count: 0 };
    }

    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { count: result.count };
  }

  async subscribePush(userId: string, dto: SubscribePushDto) {
    if (!process.env.DATABASE_URL) {
      return { success: true };
    }

    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
      },
      update: {
        userId,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
        updatedAt: new Date(),
      },
    });

    // Ensure pushEnabled is active in preferences
    await this.prisma.userNotificationPreferences.upsert({
      where: { userId },
      create: { userId, pushEnabled: true },
      update: { pushEnabled: true },
    });

    return { success: true };
  }

  async unsubscribePush(userId: string, endpoint: string) {
    if (!process.env.DATABASE_URL) {
      return { success: true };
    }

    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint, userId },
    });

    return { success: true };
  }

  private getGenericPushBody(type: NotificationType): string {
    switch (type) {
      case NotificationType.FILE_DELIVERABLE_UPLOADED:
        return 'A new deliverable was uploaded for your review.';
      case NotificationType.FILE_CHANGES_REQUESTED:
        return 'Revision notes were submitted on a deliverable.';
      case NotificationType.FILE_APPROVED:
        return 'A project deliverable has been approved.';
      case NotificationType.FILE_SOFT_DELETED:
        return 'A project file was moved to recovery.';
      case NotificationType.FILE_RESTORED:
        return 'A recovered file was restored.';
      case NotificationType.FILE_PERMANENTLY_DELETED:
        return 'A file was permanently deleted after authorization.';
      case NotificationType.MESSAGE_RECEIVED:
        return 'You have a new message in portal discussions.';
      case NotificationType.INVOICE_ISSUED:
        return 'A new project invoice is ready for your review.';
      case NotificationType.PAYMENT_CONFIRMED:
        return 'A payment record has been confirmed.';
      case NotificationType.MILESTONE_UPDATED:
        return 'A project milestone status has been updated.';
      case NotificationType.MEETING_SCHEDULED:
        return 'A project calendar meeting has been updated.';
      case NotificationType.SUPPORT_TICKET_REPLIED:
        return 'A response was posted to your support inquiry.';
      case NotificationType.SUPPORT_TICKET_RESOLVED:
        return 'Your support ticket has been marked resolved.';
      default:
        return 'You have a new update in your client portal.';
    }
  }
}

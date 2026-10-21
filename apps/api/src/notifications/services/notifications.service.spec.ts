import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: any;
  let mockWebPushService: any;

  beforeEach(() => {
    mockPrisma = {
      notification: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
      },
      userNotificationPreferences: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      pushSubscription: {
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    mockWebPushService = {
      sendGenericPush: vi.fn(),
      getPublicKey: vi.fn().mockReturnValue('test-public-key'),
    };

    service = new NotificationsService(mockPrisma, mockWebPushService);
  });

  it('creates in-app notification and dispatches generic push when enabled', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    mockPrisma.userNotificationPreferences.findUnique.mockResolvedValue({
      pushEnabled: true,
      pushDeliverables: true,
      inAppDeliverables: true,
    });

    const expectedNotif = {
      id: 'notif_1',
      userId: 'usr_client',
      type: NotificationType.FILE_DELIVERABLE_UPLOADED,
      title: 'New Deliverable',
      message: 'Design v2.0 uploaded',
      link: '/files',
      isRead: false,
    };

    mockPrisma.notification.create.mockResolvedValue(expectedNotif);

    const result = await service.createNotification('usr_client', {
      type: NotificationType.FILE_DELIVERABLE_UPLOADED,
      title: 'New Deliverable',
      message: 'Design v2.0 uploaded',
      link: '/files',
    });

    expect(result).toEqual(expectedNotif);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'usr_client',
        type: NotificationType.FILE_DELIVERABLE_UPLOADED,
        title: 'New Deliverable',
      }),
    });

    expect(mockWebPushService.sendGenericPush).toHaveBeenCalledWith('usr_client', {
      title: 'Oderinde Stephen Portal',
      body: 'A new deliverable was uploaded for your review.',
      url: '/files',
      tag: 'notif-file_deliverable_uploaded',
    });
  });

  it('routes alerts strictly to Owner in createNotificationForOwner', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'usr_owner_stephen',
      role: 'Owner',
    });

    mockPrisma.userNotificationPreferences.findUnique.mockResolvedValue(null);
    mockPrisma.notification.create.mockResolvedValue({ id: 'notif_owner_1' });

    await service.createNotificationForOwner({
      type: NotificationType.FILE_SOFT_DELETED,
      title: 'File Soft-Deleted',
      message: 'File moved to recovery',
    });

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({ where: { role: 'Owner' } });
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'usr_owner_stephen',
        type: NotificationType.FILE_SOFT_DELETED,
      }),
    });
  });

  it('marks individual notification as read', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    mockPrisma.notification.findFirst.mockResolvedValue({
      id: 'notif_1',
      userId: 'usr_client',
    });

    mockPrisma.notification.update.mockResolvedValue({
      id: 'notif_1',
      isRead: true,
      readAt: expect.any(Date),
    });

    const res = await service.markAsRead('usr_client', 'notif_1');
    expect(res.isRead).toBe(true);
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif_1' },
      data: expect.objectContaining({ isRead: true }),
    });
  });

  it('marks all notifications as read for current user', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    mockPrisma.notification.updateMany.mockResolvedValue({ count: 4 });

    const res = await service.markAllAsRead('usr_client');
    expect(res.count).toBe(4);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'usr_client', isRead: false },
      data: expect.objectContaining({ isRead: true }),
    });
  });

  it('subscribes push and activates pushEnabled preference', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    mockPrisma.pushSubscription.upsert.mockResolvedValue({});
    mockPrisma.userNotificationPreferences.upsert.mockResolvedValue({});

    const res = await service.subscribePush('usr_client', {
      endpoint: 'https://push.example.com/sub/123',
      keys: { p256dh: 'p256dh_key', auth: 'auth_key' },
      userAgent: 'Chrome on Windows 11',
    });

    expect(res.success).toBe(true);
    expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { endpoint: 'https://push.example.com/sub/123' },
      }),
    );
    expect(mockPrisma.userNotificationPreferences.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'usr_client' },
        create: { userId: 'usr_client', pushEnabled: true },
      }),
    );
  });
});

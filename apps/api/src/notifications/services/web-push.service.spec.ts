import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebPushService } from './web-push.service.js';
import webpush from 'web-push';

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

describe('WebPushService', () => {
  let service: WebPushService;
  let mockConfigService: any;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'VAPID_PUBLIC_KEY') return 'test_public_key';
        if (key === 'VAPID_PRIVATE_KEY') return 'test_private_key';
        if (key === 'VAPID_SUBJECT') return 'mailto:test@example.com';
        return null;
      }),
    };

    mockPrisma = {
      pushSubscription: {
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    service = new WebPushService(mockConfigService, mockPrisma);
  });

  it('initializes VAPID details onModuleInit', () => {
    service.onModuleInit();
    expect(webpush.setVapidDetails).toHaveBeenCalledWith(
      'mailto:test@example.com',
      'test_public_key',
      'test_private_key',
    );
    expect(service.getPublicKey()).toBe('test_public_key');
  });

  it('sends generic push payload over-the-air', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    service.onModuleInit();

    mockPrisma.pushSubscription.findMany.mockResolvedValue([
      {
        endpoint: 'https://push.example.com/endpoint1',
        p256dh: 'p256dh_val',
        auth: 'auth_val',
      },
    ]);

    await service.sendGenericPush('usr_123', {
      title: 'Portal Alert',
      body: 'Generic notification description',
      url: '/files',
      tag: 'test-tag',
    });

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: 'https://push.example.com/endpoint1',
        keys: { p256dh: 'p256dh_val', auth: 'auth_val' },
      },
      expect.stringContaining('Generic notification description'),
    );
  });

  it('prunes expired endpoint when webpush returns 410 Gone', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    service.onModuleInit();

    mockPrisma.pushSubscription.findMany.mockResolvedValue([
      {
        endpoint: 'https://push.example.com/expired-endpoint',
        p256dh: 'p256dh_val',
        auth: 'auth_val',
      },
    ]);

    (webpush.sendNotification as any).mockRejectedValue({
      statusCode: 410,
      message: 'Gone',
    });

    mockPrisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });

    await service.sendGenericPush('usr_123', {
      title: 'Alert',
      body: 'Something happened',
    });

    expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: 'https://push.example.com/expired-endpoint' },
    });
  });
});

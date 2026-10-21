import { describe, it, expect, beforeEach } from 'vitest';
import { CalComWebhookService } from './calcom-webhook.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import crypto from 'crypto';

describe('CalComWebhookService (unit)', () => {
  let service: CalComWebhookService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        findFirst: () => Promise.resolve(null),
        create: () => Promise.resolve({}),
      },
      meeting: {
        upsert: () => Promise.resolve({}),
        updateMany: () => Promise.resolve({}),
      },
      projectMembership: {
        findUnique: () => Promise.resolve(null),
      },
      user: {
        findFirst: () => Promise.resolve(null),
      },
    };
    service = new CalComWebhookService(mockPrisma as PrismaService);
  });

  describe('verifySignature', () => {
    it('verifies valid HMAC-SHA256 signature when secret is set', () => {
      const secret = 'test-calcom-secret-key';
      process.env.CALCOM_WEBHOOK_SECRET = secret;

      const payload = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', payload: { uid: '123' } });
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const signature = hmac.digest('hex');

      const isValid = service.verifySignature(payload, { 'x-cal-signature-256': signature });
      expect(isValid).toBe(true);

      delete process.env.CALCOM_WEBHOOK_SECRET;
    });

    it('rejects invalid HMAC-SHA256 signature', () => {
      const secret = 'test-calcom-secret-key';
      process.env.CALCOM_WEBHOOK_SECRET = secret;

      const payload = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', payload: { uid: '123' } });
      const isValid = service.verifySignature(payload, { 'x-cal-signature-256': 'tampered_signature_hex' });
      expect(isValid).toBe(false);

      delete process.env.CALCOM_WEBHOOK_SECRET;
    });
  });

  describe('verifyTrackingToken', () => {
    it('verifies untampered signed token and decodes payload', () => {
      const secret = 'test-internal-secret';
      process.env.INTERNAL_SIGNING_SECRET = secret;

      const payload = {
        projectId: 'proj_1',
        userId: 'user_1',
        expiresAt: Date.now() + 60000,
      };
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
      const token = `${payloadB64}.${signature}`;

      const verified = service.verifyTrackingToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.projectId).toBe('proj_1');
      expect(verified?.userId).toBe('user_1');

      delete process.env.INTERNAL_SIGNING_SECRET;
    });

    it('rejects tampered token', () => {
      const token = 'fake_payload.fake_signature';
      const verified = service.verifyTrackingToken(token);
      expect(verified).toBeNull();
    });
  });
});

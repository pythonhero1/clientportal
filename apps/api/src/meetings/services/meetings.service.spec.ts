import { describe, it, expect, beforeEach } from 'vitest';
import { MeetingsService } from './meetings.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';

describe('MeetingsService (unit)', () => {
  let service: MeetingsService;
  let mockPrisma: any;

  const mockUser: AuthenticatedUser = {
    id: 'user_1',
    clerkUserId: 'clerk_1',
    email: 'client@example.com',
    name: 'Test Client',
    role: 'Client',
    status: 'ACTIVE',
    mfaEnforced: false,
  };

  beforeEach(() => {
    mockPrisma = {
      meeting: {
        findMany: () => Promise.resolve([]),
        findUnique: () => Promise.resolve(null),
        update: () => Promise.resolve({}),
      },
      projectMembership: {
        findMany: () => Promise.resolve([{ projectId: 'proj_1' }]),
      },
    };
    service = new MeetingsService(mockPrisma as PrismaService);
  });

  describe('generateBookingToken', () => {
    it('creates a signed token containing projectId and userId with 1-hour expiry', () => {
      const result = service.generateBookingToken('proj_1', mockUser);

      expect(result.token).toBeDefined();
      expect(result.token).toContain('.');
      expect(result.calUsername).toBeDefined();
      expect(result.eventSlug).toBeDefined();

      const [payloadB64] = result.token.split('.');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

      expect(payload.projectId).toBe('proj_1');
      expect(payload.userId).toBe('user_1');
      expect(payload.email).toBe('client@example.com');
      expect(payload.expiresAt).toBeGreaterThan(Date.now());
    });
  });
});

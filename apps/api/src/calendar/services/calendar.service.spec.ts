import { describe, it, expect, beforeEach } from 'vitest';
import { CalendarService } from './calendar.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';

describe('CalendarService (unit)', () => {
  let service: CalendarService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      project: {
        findUnique: () => Promise.resolve(null),
      },
      projectMembership: {
        findUnique: () => Promise.resolve(null),
      },
      meeting: {
        findMany: () => Promise.resolve([]),
      },
      milestone: {
        findMany: () => Promise.resolve([]),
      },
      invoice: {
        findMany: () => Promise.resolve([]),
      },
    };
    service = new CalendarService(mockPrisma as PrismaService);
  });

  it('aggregates meetings and milestones correctly in test/offline fallback', async () => {
    const user: AuthenticatedUser = {
      id: 'client_billing',
      clerkUserId: 'clerk_1',
      email: 'client@example.com',
      name: 'Client Billing',
      role: 'Client',
      status: 'ACTIVE',
      mfaEnforced: false,
    };

    const result = await service.getProjectCalendar('proj_1', user);

    expect(result.timezone).toBe('Africa/Lagos');
    expect(result.events.length).toBeGreaterThan(0);
    const types = result.events.map((e) => e.type);
    expect(types).toContain('MEETING');
    expect(types).toContain('MILESTONE');
    expect(types).toContain('INVOICE');
  });

  it('excludes invoices for ordinary collaborator users in fallback mode', async () => {
    const user: AuthenticatedUser = {
      id: 'client_non_billing',
      clerkUserId: 'clerk_2',
      email: 'collaborator@example.com',
      name: 'Collaborator',
      role: 'Client',
      status: 'ACTIVE',
      mfaEnforced: false,
    };

    const result = await service.getProjectCalendar('proj_1', user);

    const types = result.events.map((e) => e.type);
    expect(types).toContain('MEETING');
    expect(types).toContain('MILESTONE');
    expect(types).not.toContain('INVOICE');
  });
});

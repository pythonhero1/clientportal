import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationAccessGuard } from './conversation-access.guard.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';

describe('ConversationAccessGuard', () => {
  let guard: ConversationAccessGuard;
  let prisma: PrismaService;

  const mockClientUser: AuthenticatedUser = {
    id: 'client_1',
    clerkUserId: 'clerk_client_1',
    email: 'client@example.com',
    role: 'Client',
    status: 'ACTIVE',
    mfaEnforced: false,
  };

  const mockOwnerUser: AuthenticatedUser = {
    id: 'owner_1',
    clerkUserId: 'clerk_owner_1',
    email: 'stephen@example.com',
    role: 'Owner',
    status: 'ACTIVE',
    mfaEnforced: true,
  };

  beforeEach(() => {
    prisma = {
      conversationMembership: {
        findUnique: vi.fn(),
      },
    } as any;
    guard = new ConversationAccessGuard(prisma);
    process.env.DATABASE_URL = 'postgresql://mock:5432/db';
  });

  const createHttpContext = (user: AuthenticatedUser | null, conversationId?: string) => {
    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: { id: conversationId },
        }),
      }),
      switchToWs: () => ({
        getClient: () => ({}),
        getData: () => ({}),
      }),
    } as any;
  };

  const createWsContext = (user: AuthenticatedUser | null, conversationId?: string) => {
    return {
      getType: () => 'ws',
      switchToWs: () => ({
        getClient: () => ({ data: { user } }),
        getData: () => ({ conversationId }),
      }),
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;
  };

  it('allows Owner to access any conversation', async () => {
    const context = createHttpContext(mockOwnerUser, 'conv_any');
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('allows Client who is an active member', async () => {
    vi.mocked(prisma.conversationMembership.findUnique).mockResolvedValue({
      conversationId: 'conv_1',
      userId: 'client_1',
      leftAt: null,
    } as any);

    const context = createHttpContext(mockClientUser, 'conv_1');
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('throws NotFoundException for non-member Client (anti-enumeration)', async () => {
    vi.mocked(prisma.conversationMembership.findUnique).mockResolvedValue(null);

    const context = createHttpContext(mockClientUser, 'conv_unauthorized');
    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException for removed Client (leftAt !== null)', async () => {
    vi.mocked(prisma.conversationMembership.findUnique).mockResolvedValue({
      conversationId: 'conv_1',
      userId: 'client_1',
      leftAt: new Date(),
    } as any);

    const context = createHttpContext(mockClientUser, 'conv_1');
    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('throws WsException in WebSocket context when unauthorized', async () => {
    vi.mocked(prisma.conversationMembership.findUnique).mockResolvedValue(null);

    const context = createWsContext(mockClientUser, 'conv_ws_unauth');
    await expect(guard.canActivate(context)).rejects.toThrow(WsException);
  });
});

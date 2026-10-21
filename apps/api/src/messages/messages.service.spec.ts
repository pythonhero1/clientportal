import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessagesService } from './services/messages.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { ScanStatus, FileVisibility, FileLifecycleStatus } from '@prisma/client';

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: PrismaService;

  const mockClientUser: AuthenticatedUser = {
    id: 'client_1',
    clerkUserId: 'clerk_client_1',
    email: 'client@example.com',
    name: 'Client One',
    role: 'Client',
    status: 'ACTIVE',
    mfaEnforced: false,
  };

  const mockOwnerUser: AuthenticatedUser = {
    id: 'owner_1',
    clerkUserId: 'clerk_owner_1',
    email: 'stephen@example.com',
    name: 'Stephen Oderinde',
    role: 'Owner',
    status: 'ACTIVE',
    mfaEnforced: true,
  };

  beforeEach(() => {
    prisma = {
      conversation: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      conversationMembership: {
        findUnique: vi.fn(),
      },
      message: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      fileVersion: {
        findUnique: vi.fn(),
      },
    } as any;

    service = new MessagesService(prisma);
    process.env.DATABASE_URL = 'postgresql://mock:5432/db';
  });

  describe('getMessages and joinedAt boundary', () => {
    it('throws NotFoundException if conversation does not exist', async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);

      await expect(
        service.getMessages('conv_missing', mockClientUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if client is not an active member (leftAt !== null)', async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: 'conv_1',
        memberships: [
          {
            userId: 'client_1',
            joinedAt: new Date('2026-10-01'),
            leftAt: new Date('2026-10-10'),
          },
        ],
      } as any);

      await expect(
        service.getMessages('conv_1', mockClientUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('filters messages to only those created on or after joinedAt for Client', async () => {
      const joinedAt = new Date('2026-10-15T12:00:00Z');
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: 'conv_1',
        memberships: [
          {
            userId: 'client_1',
            joinedAt,
            leftAt: null,
          },
        ],
      } as any);

      vi.mocked(prisma.message.findMany).mockResolvedValue([
        {
          id: 'msg_1',
          conversationId: 'conv_1',
          senderId: 'owner_1',
          content: 'Hello after joinedAt',
          createdAt: new Date('2026-10-15T13:00:00Z'),
        },
      ] as any);

      const messages = await service.getMessages('conv_1', mockClientUser);

      expect(messages).toHaveLength(1);
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            conversationId: 'conv_1',
            createdAt: { gte: joinedAt },
          },
        }),
      );
    });

    it('does not restrict messages by joinedAt for Owner', async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: 'conv_1',
        memberships: [],
      } as any);

      vi.mocked(prisma.message.findMany).mockResolvedValue([]);

      await service.getMessages('conv_1', mockOwnerUser);

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId: 'conv_1' },
        }),
      );
    });
  });

  describe('sendMessage and idempotency', () => {
    it('returns existing message without creating duplicate when idempotencyKey matches', async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: 'conv_1',
        memberships: [{ userId: 'client_1', leftAt: null }],
      } as any);

      const existingMessage = {
        id: 'msg_existing',
        conversationId: 'conv_1',
        senderId: 'client_1',
        content: 'Original message',
        idempotencyKey: 'idem-123',
        createdAt: new Date(),
      };

      vi.mocked(prisma.message.findUnique).mockResolvedValue(existingMessage as any);

      const result = await service.sendMessage(
        'conv_1',
        { content: 'Original message', idempotencyKey: 'idem-123' },
        mockClientUser,
      );

      expect(result).toEqual(existingMessage);
      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it('persists message and updates conversation lastMessageAt', async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: 'conv_1',
        memberships: [{ userId: 'client_1', leftAt: null }],
      } as any);

      vi.mocked(prisma.message.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.message.create).mockResolvedValue({
        id: 'msg_new',
        conversationId: 'conv_1',
        senderId: 'client_1',
        content: 'Hello Stephen',
        idempotencyKey: 'idem-456',
        createdAt: new Date(),
      } as any);

      const result = await service.sendMessage(
        'conv_1',
        { content: 'Hello Stephen', idempotencyKey: 'idem-456' },
        mockClientUser,
      );

      expect(result.id).toBe('msg_new');
      expect(prisma.message.create).toHaveBeenCalled();
      expect(prisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv_1' },
          data: expect.objectContaining({ lastMessageAt: expect.any(Date) }),
        }),
      );
    });

    it('rejects attachments that are in quarantine or not clean', async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: 'conv_1',
        memberships: [{ userId: 'client_1', leftAt: null }],
      } as any);

      vi.mocked(prisma.message.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.fileVersion.findUnique).mockResolvedValue({
        id: 'ver_quarantined',
        scanStatus: ScanStatus.QUARANTINED,
        file: { projectId: 'proj_1', visibility: FileVisibility.SHARED },
      } as any);

      await expect(
        service.sendMessage(
          'conv_1',
          {
            content: 'Check this out',
            idempotencyKey: 'idem-789',
            fileVersionIds: ['ver_quarantined'],
          },
          mockClientUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects attachments from a different project scope', async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: 'conv_1',
        projectId: 'proj_1',
        memberships: [{ userId: 'client_1', leftAt: null }],
      } as any);

      vi.mocked(prisma.message.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.fileVersion.findUnique).mockResolvedValue({
        id: 'ver_foreign',
        scanStatus: ScanStatus.CLEAN,
        file: { projectId: 'proj_other', visibility: FileVisibility.SHARED },
      } as any);

      await expect(
        service.sendMessage(
          'conv_1',
          {
            content: 'Foreign file',
            idempotencyKey: 'idem-foreign',
            fileVersionIds: ['ver_foreign'],
          },
          mockClientUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('syncReconnect', () => {
    it('returns missed messages strictly bounded by joinedAt', async () => {
      const joinedAt = new Date('2026-10-15T00:00:00Z');
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: 'conv_1',
        memberships: [{ userId: 'client_1', joinedAt, leftAt: null }],
      } as any);

      vi.mocked(prisma.message.findMany).mockResolvedValue([
        { id: 'msg_reconnect', createdAt: new Date('2026-10-15T10:00:00Z') },
      ] as any);

      const missed = await service.syncReconnect(
        'conv_1',
        '2026-10-14T00:00:00Z', // Client requested since before joinedAt
        mockClientUser,
      );

      expect(missed).toHaveLength(1);
      // Effective cutoff should be joinedAt, not the earlier requested date!
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            conversationId: 'conv_1',
            createdAt: { gt: joinedAt },
          },
        }),
      );
    });
  });
});

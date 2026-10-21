import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { SendMessageDto } from '../dto/send-message.dto.js';
import { FileVisibility, FileLifecycleStatus, ScanStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../../notifications/services/notifications.service.js';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    @Optional() private notificationsService?: NotificationsService,
  ) {}

  async getMessages(
    conversationId: string,
    user: AuthenticatedUser,
    cursor?: string,
    limit: number = 50,
  ) {
    if (!process.env.DATABASE_URL) {
      return this.getMockMessages(conversationId, user);
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        memberships: {
          where: { userId: user.id },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    let joinedAtCutoff: Date | undefined;

    if (user.role !== 'Owner') {
      const membership = conversation.memberships[0];
      // Anti-enumeration: if never joined or currently removed (leftAt !== null)
      if (!membership || membership.leftAt !== null) {
        throw new NotFoundException('Conversation not found.');
      }
      joinedAtCutoff = membership.joinedAt;
    }

    const whereClause: any = {
      conversationId,
    };

    // Strict joining history boundary: only see messages after joinedAt
    if (joinedAtCutoff) {
      whereClause.createdAt = {
        gte: joinedAtCutoff,
      };
    }

    return this.prisma.message.findMany({
      where: whereClause,
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true },
        },
        attachments: {
          include: {
            fileVersion: {
              select: {
                id: true,
                fileName: true,
                fileExtension: true,
                byteSize: true,
                scanStatus: true,
                fileId: true,
              },
            },
          },
        },
      },
    });
  }

  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
    user: AuthenticatedUser,
  ) {
    if (!process.env.DATABASE_URL) {
      return {
        id: `msg_${Date.now()}`,
        conversationId,
        senderId: user.id,
        content: dto.content,
        idempotencyKey: dto.idempotencyKey,
        createdAt: new Date().toISOString(),
        sender: { id: user.id, name: user.name, role: user.role },
        attachments: [],
      };
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        memberships: {
          where: { userId: user.id },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    if (user.role !== 'Owner') {
      const membership = conversation.memberships[0];
      if (!membership || membership.leftAt !== null) {
        throw new NotFoundException('Conversation not found.');
      }
    }

    // Idempotency check: if this idempotencyKey was already processed in this conversation, return existing
    const existing = await this.prisma.message.findUnique({
      where: {
        conversationId_idempotencyKey: {
          conversationId,
          idempotencyKey: dto.idempotencyKey,
        },
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true },
        },
        attachments: {
          include: {
            fileVersion: {
              select: {
                id: true,
                fileName: true,
                fileExtension: true,
                byteSize: true,
                scanStatus: true,
                fileId: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Attachment validation against authorized file versions
    if (dto.fileVersionIds && dto.fileVersionIds.length > 0) {
      for (const vId of dto.fileVersionIds) {
        const fileVersion = await this.prisma.fileVersion.findUnique({
          where: { id: vId },
          include: { file: true },
        });

        if (!fileVersion) {
          throw new NotFoundException(`File version ${vId} not found.`);
        }

        if (fileVersion.scanStatus !== ScanStatus.CLEAN) {
          throw new BadRequestException(
            `File version ${vId} cannot be attached because it is in quarantine or failed scan.`,
          );
        }

        if (conversation.projectId && fileVersion.file.projectId !== conversation.projectId) {
          throw new BadRequestException(
            `File version ${vId} does not belong to the conversation project.`,
          );
        }

        if (user.role !== 'Owner') {
          if (fileVersion.file.visibility === FileVisibility.INTERNAL) {
            throw new NotFoundException(`File version ${vId} not found.`);
          }
          if (
            fileVersion.file.lifecycleStatus !== FileLifecycleStatus.ACTIVE &&
            fileVersion.file.lifecycleStatus !== FileLifecycleStatus.ARCHIVED
          ) {
            throw new NotFoundException(`File version ${vId} not found.`);
          }
        }
      }
    }

    // Persist message to PostgreSQL BEFORE acknowledgement/broadcast
    const now = new Date();
    const createdMessage = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: dto.content,
        idempotencyKey: dto.idempotencyKey,
        createdAt: now,
        attachments: dto.fileVersionIds?.length
          ? {
              create: dto.fileVersionIds.map((fileVersionId) => ({
                fileVersionId,
              })),
            }
          : undefined,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true },
        },
        attachments: {
          include: {
            fileVersion: {
              select: {
                id: true,
                fileName: true,
                fileExtension: true,
                byteSize: true,
                scanStatus: true,
                fileId: true,
              },
            },
          },
        },
      },
    });

    // Update conversation lastMessageAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    });

    // Notify other active members of the conversation
    if (this.notificationsService && process.env.DATABASE_URL) {
      const otherMembers = await this.prisma.conversationMembership.findMany({
        where: {
          conversationId,
          leftAt: null,
          userId: { not: user.id },
        },
        select: { userId: true },
      });

      for (const member of otherMembers) {
        await this.notificationsService.createNotification(member.userId, {
          type: NotificationType.MESSAGE_RECEIVED,
          title: 'New Message Received',
          message: `${user.name || user.email} sent a message in portal discussions.`,
          link: '/messages',
          data: {
            conversationId,
            messageId: createdMessage.id,
            senderId: user.id,
          },
        }).catch(() => {});
      }
    }

    return createdMessage;
  }

  async syncReconnect(
    conversationId: string,
    since: string,
    user: AuthenticatedUser,
  ) {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        memberships: {
          where: { userId: user.id },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    let joinedAtCutoff: Date | undefined;

    if (user.role !== 'Owner') {
      const membership = conversation.memberships[0];
      if (!membership || membership.leftAt !== null) {
        throw new NotFoundException('Conversation not found.');
      }
      joinedAtCutoff = membership.joinedAt;
    }

    const sinceDate = new Date(since);
    const effectiveCutoff =
      joinedAtCutoff && joinedAtCutoff > sinceDate ? joinedAtCutoff : sinceDate;

    return this.prisma.message.findMany({
      where: {
        conversationId,
        createdAt: {
          gt: effectiveCutoff,
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true },
        },
        attachments: {
          include: {
            fileVersion: {
              select: {
                id: true,
                fileName: true,
                fileExtension: true,
                byteSize: true,
                scanStatus: true,
                fileId: true,
              },
            },
          },
        },
      },
    });
  }

  private getMockMessages(conversationId: string, user: AuthenticatedUser) {
    return [
      {
        id: 'msg_1',
        conversationId,
        senderId: 'owner_1',
        content: 'Welcome to the client portal! I have uploaded the updated v2.1 wireframes to the Files section for your review.',
        idempotencyKey: 'init-1',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        sender: {
          id: 'owner_1',
          name: 'Stephen Oderinde',
          email: 'stephen@example.com',
          role: 'Owner',
        },
        attachments: [],
      },
      {
        id: 'msg_2',
        conversationId,
        senderId: user.id,
        content: 'Thanks Stephen! Reviewing the desktop and tablet compositions now.',
        idempotencyKey: 'init-2',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        sender: {
          id: user.id,
          name: user.name || 'Client',
          email: user.email,
          role: user.role,
        },
        attachments: [],
      },
    ];
  }
}

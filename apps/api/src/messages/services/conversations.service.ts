import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { CreateConversationDto } from '../dto/create-conversation.dto.js';
import { ConversationType, ConversationMemberRole } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async getConversationsForUser(user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      return this.getMockConversations(user);
    }

    if (user.role === 'Owner') {
      return this.prisma.conversation.findMany({
        include: {
          project: {
            select: { id: true, name: true },
          },
          memberships: {
            where: { leftAt: null },
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      });
    }

    // Client only sees conversations where they are an ACTIVE member (leftAt === null)
    return this.prisma.conversation.findMany({
      where: {
        memberships: {
          some: {
            userId: user.id,
            leftAt: null,
          },
        },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        memberships: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getConversationById(id: string, user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      const mock = this.getMockConversations(user).find((c) => c.id === id);
      if (!mock) throw new NotFoundException('Conversation not found.');
      return mock;
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        memberships: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    // Anti-enumeration: verify user is Owner or active member
    if (user.role !== 'Owner') {
      const isMember = conversation.memberships.some(
        (m) => m.userId === user.id,
      );
      if (!isMember) {
        throw new NotFoundException('Conversation not found.');
      }
    }

    return conversation;
  }

  async createConversation(
    dto: CreateConversationDto,
    creator: AuthenticatedUser,
  ) {
    // Only Owner can create GROUP conversations
    if (dto.type === ConversationType.GROUP && creator.role !== 'Owner') {
      throw new ForbiddenException(
        'Only the project Owner can create group conversations.',
      );
    }

    // Prevent cross-client exposure in groups: all invited clients must be on the specified project
    if (dto.type === ConversationType.GROUP) {
      if (!dto.projectId) {
        throw new BadRequestException('Project ID is required for group conversations.');
      }

      if (process.env.DATABASE_URL) {
        const projectMembers = await this.prisma.projectMembership.findMany({
          where: { projectId: dto.projectId },
          select: { userId: true },
        });
        const validMemberIds = new Set(projectMembers.map((m) => m.userId));
        validMemberIds.add(creator.id);

        for (const uid of dto.participantUserIds) {
          if (!validMemberIds.has(uid)) {
            throw new BadRequestException(
              `User ${uid} is not a member of project ${dto.projectId}. Cross-client groups are prohibited.`,
            );
          }
        }
      }
    }

    if (!process.env.DATABASE_URL) {
      return {
        id: `conv_${Date.now()}`,
        type: dto.type,
        title: dto.title || null,
        projectId: dto.projectId || null,
        createdById: creator.id,
        createdAt: new Date().toISOString(),
      };
    }

    const allMemberIds = Array.from(
      new Set([creator.id, ...dto.participantUserIds]),
    );

    return this.prisma.conversation.create({
      data: {
        type: dto.type,
        title: dto.title,
        projectId: dto.projectId,
        createdById: creator.id,
        memberships: {
          create: allMemberIds.map((userId) => ({
            userId,
            role:
              userId === creator.id && creator.role === 'Owner'
                ? ConversationMemberRole.Owner
                : ConversationMemberRole.Member,
            joinedAt: new Date(),
          })),
        },
      },
      include: {
        memberships: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        project: { select: { id: true, name: true } },
      },
    });
  }

  async manageMember(
    conversationId: string,
    action: 'ADD' | 'REMOVE',
    targetUserId: string,
    actor: AuthenticatedUser,
  ) {
    if (actor.role !== 'Owner') {
      throw new ForbiddenException('Only the Owner can manage conversation members.');
    }

    if (!process.env.DATABASE_URL) {
      return { conversationId, targetUserId, action, status: 'SUCCESS' };
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    if (action === 'REMOVE') {
      await this.prisma.conversationMembership.updateMany({
        where: {
          conversationId,
          userId: targetUserId,
        },
        data: {
          leftAt: new Date(),
        },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'ConversationMemberRemoved',
          targetType: 'Conversation',
          targetId: conversationId,
          metadata: { targetUserId },
        },
      });

      return { conversationId, targetUserId, action: 'REMOVED', leftAt: new Date() };
    }

    // ADD / REJOIN: If previously removed, reset joinedAt to now() and clear leftAt
    // This enforces the policy: joining history starts strictly from the NEW joinedAt timestamp!
    const membership = await this.prisma.conversationMembership.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId: targetUserId,
        },
      },
      create: {
        conversationId,
        userId: targetUserId,
        role: ConversationMemberRole.Member,
        joinedAt: new Date(),
        leftAt: null,
      },
      update: {
        joinedAt: new Date(),
        leftAt: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'ConversationMemberJoined',
        targetType: 'Conversation',
        targetId: conversationId,
        metadata: { targetUserId, joinedAt: membership.joinedAt },
      },
    });

    return { conversationId, targetUserId, action: 'ADDED', joinedAt: membership.joinedAt };
  }

  private getMockConversations(user: AuthenticatedUser) {
    return [];
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async activateUser(userId: string, actorId: string) {
    if (!process.env.DATABASE_URL) {
      return { id: userId, status: 'ACTIVE' };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'AccountActivated',
        targetType: 'User',
        targetId: userId,
        metadata: {
          previousStatus: user.status,
          newStatus: 'ACTIVE',
        },
      },
    });

    return { id: updatedUser.id, status: updatedUser.status };
  }

  async createInvitation(
    data: {
      email: string;
      projectId?: string;
      isDesignatedBillingContact?: boolean;
      isDesignatedApprover?: boolean;
    },
    actorId: string,
  ) {
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (!process.env.DATABASE_URL) {
      return {
        id: 'inv_mock_123',
        email: data.email,
        token,
        expiresAt: expiresAt.toISOString(),
      };
    }

    const invitation = await this.prisma.invitation.create({
      data: {
        token,
        email: data.email,
        role: 'Client',
        projectId: data.projectId,
        isDesignatedBillingContact: data.isDesignatedBillingContact || false,
        isDesignatedApprover: data.isDesignatedApprover || false,
        invitedById: actorId,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'InvitationCreated',
        targetType: 'Invitation',
        targetId: invitation.id,
        metadata: {
          email: data.email,
          projectId: data.projectId,
        },
      },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }
}

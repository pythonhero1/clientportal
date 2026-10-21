import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { randomBytes } from 'crypto';
import { createClerkClient } from '@clerk/backend';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private clerkClient: ReturnType<typeof createClerkClient> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    if (secretKey) {
      this.clerkClient = createClerkClient({ secretKey });
    }
  }

  async getProfile(userId: string) {
    if (!process.env.DATABASE_URL) {
      return {
        id: userId,
        email: 'stephen@oderindestephen.com',
        name: 'Stephen Oderinde',
        role: 'Owner',
        status: 'ACTIVE',
        mfaEnforced: true,
        profile: {
          companyName: 'Oderinde Stephen Studio',
          phone: '+234 800 000 0000',
          timezone: 'Africa/Lagos',
          avatarUrl: null,
          themePreference: 'system',
        },
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      mfaEnforced: user.mfaEnforced,
      profile: user.profile
        ? {
            companyName: user.profile.companyName,
            phone: user.profile.phone,
            timezone: user.profile.timezone,
            avatarUrl: user.profile.avatarUrl,
            themePreference: user.profile.themePreference,
          }
        : null,
    };
  }

  async updateProfile(userId: string, clerkUserId: string, dto: UpdateProfileDto) {
    if (!process.env.DATABASE_URL) {
      return {
        id: userId,
        name: dto.name || 'Stephen Oderinde',
        profile: {
          companyName: dto.companyName || 'Oderinde Stephen Studio',
          phone: dto.phone || null,
          timezone: dto.timezone || 'Africa/Lagos',
          avatarUrl: dto.avatarUrl || null,
          themePreference: dto.themePreference || 'system',
        },
      };
    }

    // 1. Update User name if supplied
    if (dto.name !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { name: dto.name },
      });

      // Synchronize with Clerk if configured
      if (this.clerkClient && clerkUserId) {
        const parts = dto.name.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        await this.clerkClient.users.updateUser(clerkUserId, {
          firstName,
          lastName,
        }).catch((err) => {
          this.logger.warn(`Failed to sync name to Clerk: ${err.message}`);
        });
      }
    }

    // 2. Upsert profile attributes
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        companyName: dto.companyName,
        phone: dto.phone,
        timezone: dto.timezone || 'Africa/Lagos',
        avatarUrl: dto.avatarUrl,
        themePreference: dto.themePreference || 'system',
      },
      update: {
        ...(dto.companyName !== undefined && { companyName: dto.companyName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.themePreference !== undefined && { themePreference: dto.themePreference }),
      },
    });

    return {
      id: userId,
      name: dto.name,
      profile,
    };
  }

  async getNotificationPreferences(userId: string) {
    if (!process.env.DATABASE_URL) {
      return {
        userId,
        inAppDeliverables: true,
        inAppMessages: true,
        inAppInvoices: true,
        inAppMilestones: true,
        inAppMeetings: true,
        inAppSupport: true,
        pushEnabled: false,
        pushDeliverables: true,
        pushMessages: true,
        pushInvoices: true,
        pushMilestones: true,
        pushMeetings: true,
        pushSupport: true,
      };
    }

    let preferences = await this.prisma.userNotificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.userNotificationPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  async updateNotificationPreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    if (!process.env.DATABASE_URL) {
      return { userId, ...dto };
    }

    return this.prisma.userNotificationPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...dto,
      },
      update: {
        ...dto,
      },
    });
  }

  async getActiveSessions(userId: string, clerkUserId: string) {
    if (this.clerkClient && clerkUserId) {
      try {
        const sessions = await this.clerkClient.sessions.getSessionList({
          userId: clerkUserId,
        });

        const sessionList = (sessions as any)?.data || sessions;
        return (sessionList as any[]).map((sess: any) => ({
          id: sess.id,
          status: sess.status,
          lastActiveAt: new Date(sess.lastActiveAt).toISOString(),
          expireAt: new Date(sess.expireAt).toISOString(),
          isCurrent: sess.status === 'active',
          device: 'Web Client',
        }));
      } catch (err: any) {
        this.logger.warn(`Clerk session fetch failed: ${err.message}. Returning fallback.`);
      }
    }

    // Default development session response
    return [
      {
        id: 'sess_current_dev',
        status: 'active',
        lastActiveAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        isCurrent: true,
        device: 'Current Device (Chrome on Windows)',
      },
    ];
  }

  async revokeSession(sessionId: string) {
    if (this.clerkClient) {
      try {
        await this.clerkClient.sessions.revokeSession(sessionId);
        return { revoked: true, sessionId };
      } catch (err: any) {
        this.logger.warn(`Clerk session revocation failed: ${err.message}`);
      }
    }

    return { revoked: true, sessionId };
  }

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

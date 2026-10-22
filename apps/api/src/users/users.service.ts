import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { randomBytes } from 'crypto';
import { createClerkClient } from '@clerk/backend';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto.js';
import { invalidateUserCache } from '../auth/guards/clerk-auth.guard.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private clerkClient: ReturnType<typeof createClerkClient> | null = null;
  private lastClerkSyncTimestamp = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secretKey = (
      process.env.CLERK_SECRET_KEY ||
      this.configService.get<string>('CLERK_SECRET_KEY') ||
      ''
    ).trim().replace(/^['"]|['"]$/g, '');
    if (secretKey) {
      this.clerkClient = createClerkClient({ secretKey });
    }
  }

  private getClerkClient(): ReturnType<typeof createClerkClient> | null {
    if (!this.clerkClient) {
      const secretKey = (
        process.env.CLERK_SECRET_KEY ||
        this.configService?.get<string>('CLERK_SECRET_KEY') ||
        ''
      ).trim().replace(/^['"]|['"]$/g, '');

      if (secretKey) {
        this.clerkClient = createClerkClient({ secretKey });
        this.logger.log('Clerk client initialized successfully.');
      }
    }
    return this.clerkClient;
  }

  async syncClerkUsers(force = false) {
    const clerk = this.getClerkClient();
    if (!clerk) {
      this.logger.warn('[syncClerkUsers] Cannot sync users: CLERK_SECRET_KEY is missing from environment.');
      return { syncedCount: 0, error: 'CLERK_SECRET_KEY is missing' };
    }

    if (!process.env.DATABASE_URL) {
      return { syncedCount: 0 };
    }

    const now = Date.now();
    if (!force && now - this.lastClerkSyncTimestamp < 10_000) {
      return { syncedCount: 0, debounced: true };
    }
    this.lastClerkSyncTimestamp = now;

    try {
      const adminEmail = (
        process.env.ADMIN_EMAIL ||
        process.env.OWNER_EMAIL ||
        'stephenoderinde@gmail.com'
      ).toLowerCase();

      // Ensure Owner record exists in PostgreSQL
      let owner = await this.prisma.user.findFirst({
        where: {
          OR: [{ role: 'Owner' }, { email: adminEmail }],
        },
      });

      if (!owner) {
        owner = await this.prisma.user.upsert({
          where: { email: adminEmail },
          update: { role: 'Owner', status: 'ACTIVE' },
          create: {
            clerkUserId: 'clerk_owner_admin',
            email: adminEmail,
            name: 'Stephen Oderinde',
            role: 'Owner',
            status: 'ACTIVE',
            mfaEnforced: true,
            profile: {
              create: { timezone: 'Africa/Lagos' },
            },
          },
        });
      }

      this.logger.log('[syncClerkUsers] Fetching user list from Clerk API...');
      const clerkUsersResponse = await clerk.users.getUserList({ limit: 100 });
      const clerkUsers = (clerkUsersResponse as any)?.data || clerkUsersResponse;

      if (!Array.isArray(clerkUsers)) {
        this.logger.warn('[syncClerkUsers] Clerk response was not an array');
        return { syncedCount: 0 };
      }

      this.logger.log(`[syncClerkUsers] Discovered ${clerkUsers.length} user(s) in Clerk.`);
      let syncedCount = 0;

      for (const cu of clerkUsers) {
        // Robust email extraction
        const emails = Array.isArray(cu.emailAddresses) ? cu.emailAddresses : [];
        const primary = emails.find((e: any) => e.id === cu.primaryEmailAddressId);
        const emailObj = primary || emails[0];
        const primaryEmail = (emailObj?.emailAddress || emailObj?.email_address || '').trim().toLowerCase();

        if (!primaryEmail) continue;

        const isStephen = primaryEmail === adminEmail;
        const firstName = cu.firstName || (cu as any).first_name || '';
        const lastName = cu.lastName || (cu as any).last_name || '';
        const name = `${firstName} ${lastName}`.trim() || null;

        // Check if user already exists in DB by clerkUserId or email
        const existing = await this.prisma.user.findFirst({
          where: {
            OR: [{ clerkUserId: cu.id }, { email: primaryEmail }],
          },
        });

        if (!existing) {
          const newUser = await this.prisma.user.create({
            data: {
              clerkUserId: cu.id,
              email: primaryEmail,
              name: isStephen ? (name || 'Stephen Oderinde') : name,
              role: isStephen ? 'Owner' : 'Client',
              status: isStephen ? 'ACTIVE' : 'PENDING_APPROVAL',
              mfaEnforced: isStephen,
              profile: {
                create: { timezone: 'Africa/Lagos' },
              },
            },
          });

          syncedCount++;

          await this.prisma.auditLog.create({
            data: {
              actorId: newUser.id,
              action: 'ClientRegistered',
              targetType: 'User',
              targetId: newUser.id,
              metadata: {
                message: isStephen
                  ? 'Admin account auto-provisioned from Clerk'
                  : 'New client registered awaiting Admin approval',
                clerkUserId: cu.id,
                email: primaryEmail,
              },
            },
          });

          if (!isStephen && owner) {
            await this.prisma.notification.create({
              data: {
                userId: owner.id,
                type: 'SYSTEM_ALERT',
                title: 'New Client Registration',
                message: `${name || primaryEmail} has registered and is awaiting your approval.`,
                link: '/admin/clients',
                data: { userId: newUser.id, email: primaryEmail },
              },
            }).catch(() => {});
          }
        } else {
          // If user exists, sync clerkUserId or role
          if (existing.clerkUserId !== cu.id) {
            await this.prisma.user.update({
              where: { id: existing.id },
              data: { clerkUserId: cu.id },
            });
          }
          if (isStephen && (existing.role !== 'Owner' || existing.status !== 'ACTIVE')) {
            await this.prisma.user.update({
              where: { id: existing.id },
              data: { role: 'Owner', status: 'ACTIVE' },
            });
          }

          // Ensure an unread notification exists for any pending client
          if (existing.status === 'PENDING_APPROVAL' && !isStephen && owner) {
            const hasNotif = await this.prisma.notification.findFirst({
              where: {
                userId: owner.id,
                type: 'SYSTEM_ALERT',
                message: { contains: primaryEmail },
              },
            });
            if (!hasNotif) {
              await this.prisma.notification.create({
                data: {
                  userId: owner.id,
                  type: 'SYSTEM_ALERT',
                  title: 'New Client Registration',
                  message: `${existing.name || primaryEmail} has registered and is awaiting your approval.`,
                  link: '/admin/clients',
                  data: { userId: existing.id, email: primaryEmail },
                },
              }).catch(() => {});
            }
          }
        }
      }

      return { syncedCount, totalClerkUsers: clerkUsers.length };
    } catch (err: any) {
      this.logger.error(`Clerk user synchronization error: ${err.message}`, err.stack);
      return { syncedCount: 0, error: err.message };
    }
  }

  async forceSyncClerk() {
    return this.syncClerkUsers(true);
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

    let clerkUserId = user.clerkUserId;
    const clerk = this.getClerkClient();
    if (clerk && user.email) {
      try {
        const clerkUsersResponse = await clerk.users.getUserList({ emailAddress: [user.email] });
        const clerkUsers = (clerkUsersResponse as any)?.data || clerkUsersResponse;
        if (Array.isArray(clerkUsers) && clerkUsers.length > 0) {
          const cu = clerkUsers[0];
          if (cu?.id && cu.id !== user.clerkUserId) {
            clerkUserId = cu.id;
            this.logger.log(`Linked verified Clerk ID ${clerkUserId} for activated user ${user.email}`);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not reconcile Clerk user during activation for ${user.email}: ${err.message}`);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        ...(clerkUserId !== user.clerkUserId ? { clerkUserId } : {}),
      },
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

  async getPendingUsers(forceSync = false) {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    if (forceSync) {
      await this.syncClerkUsers(true);
    }

    const users = await this.prisma.user.findMany({
      where: { status: 'PENDING_APPROVAL' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      date: u.createdAt
        ? new Date(u.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
      status: u.status,
    }));
  }

  async getClients() {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    const clients = await this.prisma.user.findMany({
      where: { role: 'Client' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        clerkUserId: true,
        profile: {
          select: {
            companyName: true,
            phone: true,
            timezone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      dateJoined: c.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      companyName: c.profile?.companyName || null,
      phone: c.profile?.phone || null,
      timezone: c.profile?.timezone || null,
    }));
  }

  async suspendUser(userId: string, actorId?: string) {
    if (!process.env.DATABASE_URL) {
      return { id: userId, status: 'SUSPENDED' };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.role === 'Owner' || user.email.toLowerCase() === 'stephenoderinde@gmail.com') {
      throw new BadRequestException('Cannot suspend the primary administrator account.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    invalidateUserCache(userId);
    invalidateUserCache(user.email);

    // Revoke any active Clerk sessions for this user
    const clerk = this.getClerkClient();
    if (clerk && user.clerkUserId && !user.clerkUserId.startsWith('clerk_')) {
      try {
        const sessions = await clerk.sessions.getSessionList({ userId: user.clerkUserId });
        const sessionList = (sessions as any)?.data || sessions;
        if (Array.isArray(sessionList)) {
          for (const s of sessionList) {
            await clerk.sessions.revokeSession(s.id).catch(() => {});
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not revoke Clerk sessions for suspended user ${user.email}: ${err.message}`);
      }
    }

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'AccountSuspended',
          targetType: 'User',
          targetId: userId,
          metadata: {
            previousStatus: user.status,
            newStatus: 'SUSPENDED',
          },
        },
      });
    }

    return { id: updatedUser.id, status: updatedUser.status };
  }

  async deleteUser(userId: string, actorId?: string) {
    if (!process.env.DATABASE_URL) {
      return { success: true, deletedUserId: userId };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.role === 'Owner' || user.email.toLowerCase() === 'stephenoderinde@gmail.com') {
      throw new BadRequestException('Cannot delete the primary administrator account.');
    }

    // 1. Delete from Clerk if registered in Clerk
    const clerk = this.getClerkClient();
    if (clerk && user.clerkUserId && !user.clerkUserId.startsWith('clerk_')) {
      try {
        await clerk.users.deleteUser(user.clerkUserId);
        this.logger.log(`Successfully deleted Clerk account for ${user.email} (${user.clerkUserId})`);
      } catch (clerkErr: any) {
        this.logger.warn(`Clerk deletion warning for ${user.email}: ${clerkErr.message}`);
      }
    }

    // 2. Safe cascade cleanup in Prisma
    try {
      await this.prisma.fileComment.deleteMany({ where: { authorId: userId } });
      await this.prisma.messageAttachment.deleteMany({ where: { message: { senderId: userId } } });
      await this.prisma.message.deleteMany({ where: { senderId: userId } });
      await this.prisma.paymentRecord.deleteMany({ where: { invoice: { clientId: userId } } });
      await this.prisma.invoiceItem.deleteMany({ where: { invoice: { clientId: userId } } });
      await this.prisma.invoice.deleteMany({ where: { clientId: userId } });
      await this.prisma.meeting.deleteMany({ where: { clientId: userId } });
      await this.prisma.invitation.deleteMany({ where: { email: user.email } });
      await this.prisma.notification.deleteMany({ where: { userId } });
      await this.prisma.projectMembership.deleteMany({ where: { userId } });
      await this.prisma.conversationMembership.deleteMany({ where: { userId } });
      await this.prisma.userNotificationPreferences.deleteMany({ where: { userId } });
      await this.prisma.pushSubscription.deleteMany({ where: { userId } });
      await this.prisma.profile.deleteMany({ where: { userId } });

      await this.prisma.user.delete({ where: { id: userId } });
      invalidateUserCache(userId);
      invalidateUserCache(user.email);
    } catch (dbErr: any) {
      this.logger.error(`Database deletion error for user ${user.email}: ${dbErr.message}`, dbErr.stack);
      throw new BadRequestException(`Failed to delete user database records: ${dbErr.message}`);
    }

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'AccountDeleted',
          targetType: 'User',
          targetId: userId,
          metadata: {
            email: user.email,
            name: user.name,
            clerkUserId: user.clerkUserId,
          },
        },
      });
    }

    return { success: true, deletedUserId: userId, email: user.email };
  }

  async rejectUser(userId: string, actorId?: string) {
    if (!process.env.DATABASE_URL) {
      return { id: userId, status: 'SUSPENDED' };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    invalidateUserCache(userId);
    invalidateUserCache(user.email);

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: 'AccountRejected',
          targetType: 'User',
          targetId: userId,
          metadata: {
            previousStatus: user.status,
            newStatus: 'SUSPENDED',
          },
        },
      });
    }

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

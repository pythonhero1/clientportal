import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from './guards/clerk-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { AuthenticatedUser } from './decorators/current-user.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

class AcceptInvitationDto {
  token!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      return {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        name: user.name,
        role: user.role === 'Owner' || (user.role as string) === 'Admin' ? 'Admin' : 'Client',
        status: user.status,
        mfaEnforced: user.mfaEnforced,
        profile: {
          companyName: null,
          phone: null,
          timezone: 'Africa/Lagos',
          avatarUrl: null,
          themePreference: 'system',
        },
      };
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    if (!dbUser) {
      return {
        ...user,
        profile: {
          companyName: null,
          phone: null,
          timezone: 'Africa/Lagos',
          avatarUrl: null,
          themePreference: 'system',
        },
      };
    }

    const adminEmail = (process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL || 'stephenoderinde@gmail.com').toLowerCase();
    const isStephenAdmin = dbUser.email.toLowerCase() === adminEmail;

    if (isStephenAdmin && (dbUser.role !== 'Owner' || dbUser.status !== 'ACTIVE')) {
      this.prisma.user.update({
        where: { id: dbUser.id },
        data: { role: 'Owner', status: 'ACTIVE' },
      }).catch(() => {});
    }

    const resolvedRole = isStephenAdmin || dbUser.role === 'Owner' || (dbUser.role as string) === 'Admin' ? 'Admin' : 'Client';
    const resolvedStatus = isStephenAdmin ? 'ACTIVE' : dbUser.status;

    return {
      id: dbUser.id,
      clerkUserId: dbUser.clerkUserId,
      email: dbUser.email,
      name: dbUser.name,
      role: resolvedRole,
      status: resolvedStatus,
      mfaEnforced: dbUser.mfaEnforced,
      profile: dbUser.profile
        ? {
            companyName: dbUser.profile.companyName,
            phone: dbUser.profile.phone,
            timezone: dbUser.profile.timezone,
            avatarUrl: dbUser.profile.avatarUrl,
            themePreference: dbUser.profile.themePreference,
          }
        : null,
    };
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  async acceptInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AcceptInvitationDto,
  ) {
    if (!process.env.DATABASE_URL) {
      return { status: 'ACTIVE', projectId: null };
    }

    const invitation = await this.prisma.invitation.findUnique({
      where: { token: body.token },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundException('Invitation token is invalid or has already been used.');
    }

    // Activate the user and link to project if specified
    await this.prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      if (invitation.projectId) {
        await tx.projectMembership.upsert({
          where: {
            projectId_userId: {
              projectId: invitation.projectId,
              userId: user.id,
            },
          },
          create: {
            projectId: invitation.projectId,
            userId: user.id,
            isDesignatedBillingContact: invitation.isDesignatedBillingContact,
            isDesignatedApprover: invitation.isDesignatedApprover,
          },
          update: {},
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'InvitationAccepted',
          targetType: 'Invitation',
          targetId: invitation.id,
        },
      });
    });

    return { status: 'ACTIVE', projectId: invitation.projectId };
  }

  @Post('register-client')
  @HttpCode(HttpStatus.OK)
  async registerClient(@Body() body: { email: string; name?: string; clerkUserId?: string }) {
    if (!body?.email) {
      return { success: false, message: 'Email is required' };
    }

    const email = body.email.toLowerCase().trim();
    const adminEmail = (
      process.env.ADMIN_EMAIL ||
      process.env.OWNER_EMAIL ||
      'stephenoderinde@gmail.com'
    ).toLowerCase();

    if (!process.env.DATABASE_URL) {
      return { success: true, status: 'PENDING_APPROVAL' };
    }

    const isStephen = email === adminEmail;
    const name = body.name?.trim() || null;
    const clerkUserId = body.clerkUserId || `clerk_${Date.now()}`;

    // Find if user already exists
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(body.clerkUserId ? [{ clerkUserId: body.clerkUserId }] : []),
          { email },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          clerkUserId,
          email,
          name: isStephen ? (name || 'Oderinde Stephen') : name,
          role: isStephen ? 'Owner' : 'Client',
          status: isStephen ? 'ACTIVE' : 'PENDING_APPROVAL',
          mfaEnforced: isStephen,
          profile: {
            create: { timezone: 'Africa/Lagos' },
          },
        },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'ClientRegistered',
          targetType: 'User',
          targetId: user.id,
          metadata: {
            message: isStephen
              ? 'Admin account created'
              : 'New client registration awaiting Admin approval',
            clerkUserId,
            email,
          },
        },
      });

      if (!isStephen) {
        const owner = await this.prisma.user.findFirst({
          where: {
            OR: [{ role: 'Owner' }, { email: adminEmail }],
          },
        });

        if (owner) {
          await this.prisma.notification.create({
            data: {
              userId: owner.id,
              type: 'SYSTEM_ALERT',
              title: 'New Client Registration',
              message: `${user.name || user.email} has registered and is awaiting your approval.`,
              link: '/admin/clients',
              data: { userId: user.id, email: user.email },
            },
          }).catch(() => {});
        }
      }
    } else if (body.clerkUserId && user.clerkUserId !== body.clerkUserId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { clerkUserId: body.clerkUserId },
      });
    }

    return {
      success: true,
      userId: user.id,
      status: user.status,
    };
  }
}

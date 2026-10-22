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

    return {
      id: dbUser.id,
      clerkUserId: dbUser.clerkUserId,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role === 'Owner' || (dbUser.role as string) === 'Admin' ? 'Admin' : 'Client',
      status: dbUser.status,
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
}

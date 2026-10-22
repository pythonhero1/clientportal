import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../decorators/current-user.decorator.js';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const secretKey = (process.env.CLERK_SECRET_KEY || '').trim().replace(/^['"]|['"]$/g, '');

    // In testing or development simulation mode
    if (process.env.NODE_ENV === 'test' || !secretKey) {
      const mockUserId = request.headers['x-mock-user-id'];
      if (mockUserId) {
        request.user = {
          id: mockUserId,
          clerkUserId: `clerk_${mockUserId}`,
          email: `${mockUserId}@example.com`,
          name: `Mock ${mockUserId}`,
          role: request.headers['x-mock-role'] === 'Owner' ? 'Owner' : 'Client',
          status: request.headers['x-mock-status'] || 'ACTIVE',
          mfaEnforced: request.headers['x-mock-mfa'] === 'true',
        } as AuthenticatedUser;
        return true;
      }
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header.');
    }

    const token = authHeader.split(' ')[1];

    try {
      if (secretKey) {
        const { createClerkClient } = await import('@clerk/backend');
        const clerk = createClerkClient({ secretKey });
        const verifiedToken = await clerk.authenticateRequest(request);

        if (!verifiedToken.isSignedIn) {
          throw new UnauthorizedException('Invalid or expired authentication session.');
        }

        const clerkUserId = verifiedToken.toAuth().userId;
        if (!clerkUserId) {
          throw new UnauthorizedException('No user subject in authentication token.');
        }

        if (process.env.DATABASE_URL) {
          const adminEmail = (process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL || 'stephenoderinde@gmail.com').toLowerCase();

          let user = await this.prisma.user.findUnique({
            where: { clerkUserId },
          });

          // If user record is not yet linked to this clerkUserId, attempt linking by verified email:
          if (!user) {
            try {
              const clerkUser = await clerk.users.getUser(clerkUserId);
              const primaryEmail =
                clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
                clerkUser.emailAddresses?.[0]?.emailAddress;

              if (primaryEmail) {
                const existingUser = await this.prisma.user.findUnique({
                  where: { email: primaryEmail.toLowerCase() },
                });

                if (existingUser) {
                  user = await this.prisma.user.update({
                    where: { id: existingUser.id },
                    data: { clerkUserId },
                  });
                  console.log(`[ClerkAuthGuard] Successfully linked Clerk user ${clerkUserId} to database user ${user.id} (${user.email})`);
                } else if (primaryEmail.toLowerCase() === adminEmail) {
                  user = await this.prisma.user.create({
                    data: {
                      email: adminEmail,
                      name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : 'Oderinde Stephen',
                      role: 'Owner',
                      status: 'ACTIVE',
                      clerkUserId,
                      mfaEnforced: true,
                      profile: {
                        create: { timezone: 'Africa/Lagos' },
                      },
                    },
                  });
                }
              }
            } catch (linkErr: any) {
              console.warn('[ClerkAuthGuard] User lookup/linking by email failed:', linkErr.message);
            }
          }

          if (!user) {
            throw new UnauthorizedException('User record not found in portal database.');
          }

          // Force Admin/Owner role and ACTIVE status for Stephen's designated email
          const isStephenAdmin = user.email.toLowerCase() === adminEmail;
          if (isStephenAdmin && (user.role !== 'Owner' || user.status !== 'ACTIVE')) {
            try {
              user = await this.prisma.user.update({
                where: { id: user.id },
                data: { role: 'Owner', status: 'ACTIVE' },
              });
              console.log(`[ClerkAuthGuard] Enforced Owner/Admin role for ${user.email}`);
            } catch (syncErr: any) {
              console.warn('[ClerkAuthGuard] Error syncing admin role:', syncErr.message);
            }
          }

          const resolvedRole: 'Admin' | 'Owner' | 'Client' = isStephenAdmin || user.role === 'Owner' || (user.role as string) === 'Admin' ? 'Admin' : 'Client';
          const resolvedStatus = isStephenAdmin ? 'ACTIVE' : user.status;

          request.user = {
            id: user.id,
            clerkUserId: user.clerkUserId,
            email: user.email,
            name: user.name,
            role: resolvedRole,
            status: resolvedStatus,
            mfaEnforced: user.mfaEnforced,
          } as AuthenticatedUser;
        } else {
          // Fallback if database is not connected
          const adminEmail = (process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL || 'stephenoderinde@gmail.com').toLowerCase();
          request.user = {
            id: clerkUserId,
            clerkUserId,
            email: adminEmail,
            name: 'Oderinde Stephen',
            role: 'Admin',
            status: 'ACTIVE',
            mfaEnforced: true,
          } as AuthenticatedUser;
        }

        return true;
      }

      // Default bearer parsing for local mock testing
      if (token.startsWith('test_')) {
        const role = token.includes('owner') ? 'Owner' : 'Client';
        const status = token.includes('pending') ? 'PENDING_APPROVAL' : 'ACTIVE';
        request.user = {
          id: token,
          clerkUserId: `clerk_${token}`,
          email: `${token}@example.com`,
          name: token,
          role,
          status,
          mfaEnforced: role === 'Owner',
        } as AuthenticatedUser;
        return true;
      }

      throw new UnauthorizedException('Invalid bearer token.');
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Authentication verification failed.');
    }
  }
}

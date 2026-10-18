import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../decorators/current-user.decorator.js';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    // In testing or development simulation mode
    if (process.env.NODE_ENV === 'test' || !process.env.CLERK_SECRET_KEY) {
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
      if (process.env.CLERK_SECRET_KEY) {
        const { createClerkClient } = await import('@clerk/backend');
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const verifiedToken = await clerk.authenticateRequest(request);

        if (!verifiedToken.isSignedIn) {
          throw new UnauthorizedException('Invalid or expired authentication session.');
        }

        const clerkUserId = verifiedToken.toAuth().userId;
        if (!clerkUserId) {
          throw new UnauthorizedException('No user subject in authentication token.');
        }

        if (process.env.DATABASE_URL) {
          const user = await this.prisma.user.findUnique({
            where: { clerkUserId },
          });

          if (!user) {
            throw new UnauthorizedException('User record not found in portal database.');
          }

          request.user = {
            id: user.id,
            clerkUserId: user.clerkUserId,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            mfaEnforced: user.mfaEnforced,
          } as AuthenticatedUser;
        } else {
          // Fallback if database is not connected
          request.user = {
            id: clerkUserId,
            clerkUserId,
            email: 'user@example.com',
            name: null,
            role: 'Client',
            status: 'ACTIVE',
            mfaEnforced: false,
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

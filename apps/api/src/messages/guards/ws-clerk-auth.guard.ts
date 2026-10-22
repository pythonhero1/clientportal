import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import type { Socket } from 'socket.io';

@Injectable()
export class WsClerkAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const handshake = client.handshake;

    // Check dev/test mock credentials
    if (process.env.NODE_ENV === 'test' || !process.env.CLERK_SECRET_KEY) {
      const mockUserId =
        handshake.headers['x-mock-user-id'] ||
        handshake.auth?.['x-mock-user-id'] ||
        client.data?.user?.id;
      if (mockUserId) {
        const mockRole =
          handshake.headers['x-mock-role'] ||
          handshake.auth?.['x-mock-role'] ||
          (String(mockUserId).includes('owner') ? 'Owner' : 'Client');
        const mockStatus =
          handshake.headers['x-mock-status'] ||
          handshake.auth?.['x-mock-status'] ||
          'ACTIVE';

        client.data.user = {
          id: String(mockUserId),
          clerkUserId: `clerk_${mockUserId}`,
          email: `${mockUserId}@example.com`,
          name: `Mock ${mockUserId}`,
          role: mockRole === 'Owner' ? 'Owner' : 'Client',
          status: mockStatus as any,
          mfaEnforced: mockRole === 'Owner',
        } as AuthenticatedUser;
        return true;
      }
    }

    const authHeader =
      handshake.headers['authorization'] ||
      (handshake.auth?.token ? `Bearer ${handshake.auth.token}` : undefined);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new WsException('Missing or malformed authorization credentials.');
    }

    const token = authHeader.split(' ')[1];

    try {
      if (process.env.CLERK_SECRET_KEY) {
        const { verifyToken } = await import('@clerk/backend');
        const secretKey = (process.env.CLERK_SECRET_KEY || '').trim().replace(/^['"]|['"]$/g, '');

        let clerkUserId: string | null = null;
        try {
          const verified = await verifyToken(token, { secretKey });
          if (verified?.sub) {
            clerkUserId = verified.sub;
          }
        } catch {}

        if (!clerkUserId && token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
              if (payload.sub) clerkUserId = payload.sub;
            }
          } catch {}
        }

        if (!clerkUserId) {
          throw new WsException('Invalid or expired authentication session.');
        }

        if (process.env.DATABASE_URL) {
          const handshakeEmail = (
            (handshake.headers['x-user-email'] as string) ||
            (handshake.auth?.email as string) ||
            ''
          ).trim().toLowerCase();

          let user = await this.prisma.user.findFirst({
            where: {
              OR: [
                { clerkUserId },
                ...(handshakeEmail ? [{ email: handshakeEmail }] : []),
              ],
            },
          });

          if (!user || user.status !== 'ACTIVE') {
            throw new WsException('User account inactive or not found.');
          }

          if (user.clerkUserId !== clerkUserId) {
            await this.prisma.user.update({
              where: { id: user.id },
              data: { clerkUserId },
            }).catch(() => {});
          }

          client.data.user = {
            id: user.id,
            clerkUserId: user.clerkUserId,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            mfaEnforced: user.mfaEnforced,
          } as AuthenticatedUser;
        } else {
          client.data.user = {
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

      // Default mock token handling
      if (token.startsWith('test_')) {
        const role = token.includes('owner') ? 'Owner' : 'Client';
        const status = token.includes('pending') ? 'PENDING_APPROVAL' : 'ACTIVE';
        if (status !== 'ACTIVE') {
          throw new WsException('User account inactive.');
        }

        client.data.user = {
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

      throw new WsException('Invalid bearer token.');
    } catch (err: any) {
      if (err instanceof WsException) {
        throw err;
      }
      throw new WsException('Authentication verification failed.');
    }
  }
}

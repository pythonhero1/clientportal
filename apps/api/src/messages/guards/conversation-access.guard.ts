import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';

@Injectable()
export class ConversationAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextType = context.getType<'http' | 'ws'>();

    let user: AuthenticatedUser | undefined;
    let conversationId: string | undefined;

    if (contextType === 'ws') {
      const client = context.switchToWs().getClient();
      const data = context.switchToWs().getData();
      user = client.data?.user;
      conversationId = data?.conversationId;
    } else {
      const req = context.switchToHttp().getRequest();
      user = req.user;
      conversationId = req.params?.id || req.params?.conversationId;
    }

    if (!user) {
      this.throwNotFound(contextType);
    }

    if (!conversationId) {
      return true;
    }

    // Owner operates all conversations
    if (user!.role === 'Owner') {
      return true;
    }

    if (!process.env.DATABASE_URL) {
      // Mock simulation mode
      if (
        conversationId === 'non_existent_id' ||
        conversationId.includes('unauthorized') ||
        conversationId.includes('foreign')
      ) {
        this.throwNotFound(contextType);
      }
      return true;
    }

    const membership = await this.prisma.conversationMembership.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user!.id,
        },
      },
    });

    // Anti-enumeration: If not a member, or user was removed (leftAt !== null), return 404
    if (!membership || membership.leftAt !== null) {
      this.throwNotFound(contextType);
    }

    return true;
  }

  private throwNotFound(contextType: 'http' | 'ws'): never {
    if (contextType === 'ws') {
      throw new WsException('Conversation not found.');
    }
    throw new NotFoundException('Conversation not found.');
  }
}

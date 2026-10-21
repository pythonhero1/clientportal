import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class TicketAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ticketId = request.params.ticketId;

    if (!ticketId) {
      return true;
    }

    if (!process.env.DATABASE_URL) {
      // Mock development pass-through
      request.ticket = { id: ticketId, clientId: user?.id, status: 'OPEN' };
      return true;
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Anti-enumeration: If ticket does not exist, return 404
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }

    // Owner can access any ticket
    if (user.role === 'Owner') {
      request.ticket = ticket;
      return true;
    }

    // Client can only access their own ticket. If belongs to another client, return strict 404 (anti-enumeration)
    if (ticket.clientId !== user.id) {
      throw new NotFoundException('Ticket not found.');
    }

    request.ticket = ticket;
    return true;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { CreateTicketDto } from '../dto/create-ticket.dto.js';
import { SendTicketMessageDto } from '../dto/send-ticket-message.dto.js';
import { TriageTicketDto } from '../dto/triage-ticket.dto.js';
import { NotificationType, TicketPriority, TicketStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async createTicket(clientId: string, dto: CreateTicketDto) {
    if (!process.env.DATABASE_URL) {
      const ticketNumber = `TCK-${new Date().getFullYear()}-0001`;
      return {
        id: 'tck_mock_' + Date.now(),
        ticketNumber,
        clientId,
        projectId: dto.projectId || null,
        subject: dto.subject,
        status: TicketStatus.OPEN,
        priority: dto.priority || TicketPriority.NORMAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const ticketNumber = await this.generateTicketNumber();

    const ticket = await this.prisma.$transaction(async (tx) => {
      const createdTicket = await tx.ticket.create({
        data: {
          ticketNumber,
          clientId,
          projectId: dto.projectId || null,
          subject: dto.subject,
          status: TicketStatus.OPEN,
          priority: dto.priority || TicketPriority.NORMAL,
        },
      });

      await tx.ticketMessage.create({
        data: {
          ticketId: createdTicket.id,
          authorId: clientId,
          content: dto.description,
        },
      });

      return createdTicket;
    });

    // Notify Stephen (Owner)
    if (this.notificationsService) {
      await this.notificationsService.createNotificationForOwner({
        type: NotificationType.SUPPORT_TICKET_REPLIED,
        title: `New Ticket: ${ticket.ticketNumber}`,
        message: `New support ticket opened: "${dto.subject}"`,
        link: '/owner/support',
        data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
      }).catch((err) => {
        this.logger.warn(`Failed to notify owner of new ticket: ${err.message}`);
      });
    }

    return ticket;
  }

  async getClientTickets(clientId: string, status?: TicketStatus) {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    const where: any = { clientId };
    if (status) {
      where.status = status;
    }

    return this.prisma.ticket.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getTicketDetails(ticketId: string) {
    if (!process.env.DATABASE_URL) {
      return {
        id: ticketId,
        ticketNumber: 'TCK-2026-0001',
        subject: 'Mock Ticket',
        status: TicketStatus.OPEN,
        priority: TicketPriority.NORMAL,
        messages: [],
      };
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        client: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }

    return ticket;
  }

  async addMessage(ticketId: string, author: AuthenticatedUser, dto: SendTicketMessageDto) {
    if (!process.env.DATABASE_URL) {
      return {
        id: 'tmsg_mock_' + Date.now(),
        ticketId,
        authorId: author.id,
        content: dto.content,
        createdAt: new Date(),
      };
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }

    if (ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('Cannot reply to a closed ticket. Please open a new ticket.');
    }

    // Determine status transition
    const nextStatus =
      author.role === 'Owner'
        ? TicketStatus.WAITING_FOR_CLIENT
        : TicketStatus.WAITING_FOR_OWNER;

    const [message] = await this.prisma.$transaction([
      this.prisma.ticketMessage.create({
        data: {
          ticketId,
          authorId: author.id,
          content: dto.content,
        },
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: nextStatus,
          updatedAt: new Date(),
        },
      }),
    ]);

    // Dispatch notification
    if (this.notificationsService) {
      if (author.role === 'Owner') {
        // Notify Client
        await this.notificationsService.createNotification(ticket.clientId, {
          type: NotificationType.SUPPORT_TICKET_REPLIED,
          title: `Reply on Ticket ${ticket.ticketNumber}`,
          message: `Stephen replied to your ticket: "${ticket.subject}"`,
          link: '/support',
          data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
        }).catch(() => {});
      } else {
        // Notify Owner
        await this.notificationsService.createNotificationForOwner({
          type: NotificationType.SUPPORT_TICKET_REPLIED,
          title: `Client Reply: ${ticket.ticketNumber}`,
          message: `${author.name || author.email} replied to ticket "${ticket.subject}"`,
          link: '/owner/support',
          data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
        }).catch(() => {});
      }
    }

    return message;
  }

  async updateClientStatus(ticketId: string, status: TicketStatus) {
    if (!process.env.DATABASE_URL) {
      return { id: ticketId, status };
    }

    const updateData: any = { status, updatedAt: new Date() };
    if (status === TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    } else if (status === TicketStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });
  }

  async getOwnerQueue(filter: {
    status?: TicketStatus;
    priority?: TicketPriority;
    clientId?: string;
  }) {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.clientId) where.clientId = filter.clientId;

    return this.prisma.ticket.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async triageTicket(ticketId: string, dto: TriageTicketDto) {
    if (!process.env.DATABASE_URL) {
      return { id: ticketId, ...dto };
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }

    const updateData: any = { updatedAt: new Date() };
    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === TicketStatus.RESOLVED) {
        updateData.resolvedAt = new Date();
      } else if (dto.status === TicketStatus.CLOSED) {
        updateData.closedAt = new Date();
      }
    }
    if (dto.priority) {
      updateData.priority = dto.priority;
    }
    if (dto.assignedToId !== undefined) {
      updateData.assignedToId = dto.assignedToId;
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    if (dto.status === TicketStatus.RESOLVED && this.notificationsService) {
      await this.notificationsService.createNotification(ticket.clientId, {
        type: NotificationType.SUPPORT_TICKET_RESOLVED,
        title: `Ticket Resolved: ${ticket.ticketNumber}`,
        message: `Your support ticket "${ticket.subject}" has been marked resolved.`,
        link: '/support',
        data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
      }).catch(() => {});
    }

    return updated;
  }

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TCK-${year}-`;
    try {
      const latest = await this.prisma.ticket.findFirst({
        where: { ticketNumber: { startsWith: prefix } },
        orderBy: { ticketNumber: 'desc' },
        select: { ticketNumber: true },
      });
      let seq = 1;
      if (latest && latest.ticketNumber) {
        const parts = latest.ticketNumber.split('-');
        if (parts.length === 3) {
          const parsed = parseInt(parts[2], 10);
          if (!isNaN(parsed)) {
            seq = parsed + 1;
          }
        }
      }
      return `${prefix}${String(seq).padStart(4, '0')}`;
    } catch {
      const count = await this.prisma.ticket.count();
      return `${prefix}${String(count + 1).padStart(4, '0')}`;
    }
  }
}

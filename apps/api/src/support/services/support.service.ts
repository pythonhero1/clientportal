import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Ticket, TicketMessage, TicketStatus, HelpArticle } from '@prisma/client';
import { CreateTicketDto, ReplyTicketDto, UpdateTicketStatusDto } from '../dto/support.dto.js';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async listClientTickets(clientId: string): Promise<Ticket[]> {
    return this.prisma.ticket.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
  }

  async getClientTicketDetail(ticketId: string, clientId: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, clientId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
        project: { select: { id: true, name: true } },
      },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async createTicket(clientId: string, dto: CreateTicketDto): Promise<Ticket> {
    const count = await this.prisma.ticket.count();
    const ticketNumber = `TCK-${(count + 101).toString().padStart(4, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          clientId,
          projectId: dto.projectId,
          subject: dto.subject,
          priority: dto.priority,
          status: TicketStatus.OPEN,
        },
      });

      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: clientId,
          content: dto.message,
        },
      });

      return ticket;
    });
  }

  async addReply(
    ticketId: string,
    authorId: string,
    dto: ReplyTicketDto,
    isOwner: boolean,
  ): Promise<TicketMessage> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!isOwner && ticket.clientId !== authorId) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const msg = await tx.ticketMessage.create({
        data: {
          ticketId,
          authorId,
          content: dto.message,
        },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      });

      const nextStatus = dto.status || (isOwner ? TicketStatus.WAITING_FOR_CLIENT : TicketStatus.WAITING_FOR_OWNER);
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: nextStatus },
      });

      return msg;
    });
  }

  async listOwnerTickets(status?: TicketStatus): Promise<Ticket[]> {
    return this.prisma.ticket.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async updateTicketStatus(ticketId: string, dto: UpdateTicketStatusDto): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        resolvedAt: dto.status === TicketStatus.RESOLVED ? new Date() : undefined,
        closedAt: dto.status === TicketStatus.CLOSED ? new Date() : undefined,
      },
    });
  }

  async listHelpArticles(): Promise<HelpArticle[]> {
    return this.prisma.helpArticle.findMany({
      where: { isPublished: true },
      orderBy: { orderIndex: 'asc' },
      include: { category: true },
    });
  }
}

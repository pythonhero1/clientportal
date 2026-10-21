import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketsService } from './tickets.service.js';
import { TicketPriority, TicketStatus } from '@prisma/client';

describe('TicketsService', () => {
  let service: TicketsService;
  let mockPrisma: any;
  let mockNotificationsService: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(async (callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      }),
      ticket: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      },
      ticketMessage: {
        create: vi.fn(),
      },
    };

    mockNotificationsService = {
      createNotification: vi.fn().mockResolvedValue({}),
      createNotificationForOwner: vi.fn().mockResolvedValue({}),
    };

    service = new TicketsService(mockPrisma, mockNotificationsService);
  });

  it('creates ticket in OPEN status, creates first message, and notifies Owner', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    const created = {
      id: 'tck_1',
      ticketNumber: 'TCK-2026-0001',
      clientId: 'client_1',
      subject: 'Issue with assets',
      status: TicketStatus.OPEN,
      priority: TicketPriority.NORMAL,
    };

    mockPrisma.ticket.create.mockResolvedValue(created);
    mockPrisma.ticketMessage.create.mockResolvedValue({ id: 'msg_1' });

    const result = await service.createTicket('client_1', {
      subject: 'Issue with assets',
      description: 'Cannot download Figma assets',
    });

    expect(result).toEqual(created);
    expect(mockPrisma.ticket.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ticketNumber: expect.stringMatching(/^TCK-\d{4}-\d{4}$/),
        clientId: 'client_1',
        status: TicketStatus.OPEN,
      }),
    });
    expect(mockNotificationsService.createNotificationForOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('TCK-2026-0001'),
      }),
    );
  });

  it('transitions status to WAITING_FOR_OWNER when Client replies', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: 'tck_1',
      clientId: 'client_1',
      ticketNumber: 'TCK-2026-0001',
      subject: 'Question',
      status: TicketStatus.OPEN,
    });

    mockPrisma.ticketMessage.create.mockResolvedValue({ id: 'msg_2', content: 'Any update?' });
    mockPrisma.ticket.update.mockResolvedValue({ id: 'tck_1', status: TicketStatus.WAITING_FOR_OWNER });

    const clientUser: any = { id: 'client_1', role: 'Client', email: 'client@example.com' };
    await service.addMessage('tck_1', clientUser, { content: 'Any update?' });

    expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TicketStatus.WAITING_FOR_OWNER }),
      }),
    );
    expect(mockNotificationsService.createNotificationForOwner).toHaveBeenCalled();
  });

  it('transitions status to WAITING_FOR_CLIENT when Owner replies', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: 'tck_1',
      clientId: 'client_1',
      ticketNumber: 'TCK-2026-0001',
      subject: 'Question',
      status: TicketStatus.WAITING_FOR_OWNER,
    });

    mockPrisma.ticketMessage.create.mockResolvedValue({ id: 'msg_3', content: 'Resolved now' });
    mockPrisma.ticket.update.mockResolvedValue({ id: 'tck_1', status: TicketStatus.WAITING_FOR_CLIENT });

    const ownerUser: any = { id: 'owner_1', role: 'Owner', email: 'stephen@oderindestephen.com' };
    await service.addMessage('tck_1', ownerUser, { content: 'Resolved now' });

    expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TicketStatus.WAITING_FOR_CLIENT }),
      }),
    );
    expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
      'client_1',
      expect.objectContaining({
        title: expect.stringContaining('TCK-2026-0001'),
      }),
    );
  });

  it('rejects replies to a CLOSED ticket', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: 'tck_1',
      status: TicketStatus.CLOSED,
    });

    const clientUser: any = { id: 'client_1', role: 'Client' };
    await expect(service.addMessage('tck_1', clientUser, { content: 'Hello' })).rejects.toThrow(
      'Cannot reply to a closed ticket',
    );
  });
});

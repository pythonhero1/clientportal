import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SupportHelpPage } from './SupportHelpPage';

vi.mock('../../../services/support-api', () => ({
  fetchHelpCategories: vi.fn().mockResolvedValue([
    { id: 'cat_1', name: 'Deliverables & Revisions', slug: 'deliverables', orderIndex: 0 },
    { id: 'cat_2', name: 'Invoicing & Payments', slug: 'invoicing', orderIndex: 1 },
  ]),
  fetchHelpArticles: vi.fn().mockResolvedValue([
    {
      id: 'art_1',
      categoryId: 'cat_1',
      category: { id: 'cat_1', name: 'Deliverables & Revisions', slug: 'deliverables' },
      title: 'How Deliverable Approvals Work',
      slug: 'how-deliverable-approvals-work',
      content: 'Deliverables are reviewed and approved per milestone...',
      excerpt: 'Step by step guide on reviewing project deliverables.',
      isPublished: true,
      publishedAt: new Date().toISOString(),
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]),
  fetchMyTickets: vi.fn().mockResolvedValue([
    {
      id: 'tck_1',
      ticketNumber: 'TCK-2026-0001',
      clientId: 'usr_client',
      subject: 'Question on asset export format',
      status: 'OPEN',
      priority: 'NORMAL',
      project: { id: 'prj_1', name: 'E-Commerce Redesign' },
      _count: { messages: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]),
  fetchTicketDetails: vi.fn().mockResolvedValue({
    id: 'tck_1',
    ticketNumber: 'TCK-2026-0001',
    clientId: 'usr_client',
    subject: 'Question on asset export format',
    status: 'OPEN',
    priority: 'NORMAL',
    messages: [
      {
        id: 'msg_1',
        ticketId: 'tck_1',
        authorId: 'usr_client',
        author: { id: 'usr_client', name: 'Client Demo', email: 'client@example.com', role: 'Client' },
        content: 'Hi Stephen, can you export icons as SVGs?',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  }),
  createTicket: vi.fn().mockResolvedValue({
    id: 'tck_2',
    ticketNumber: 'TCK-2026-0002',
    clientId: 'usr_client',
    subject: 'New Ticket Title',
    status: 'OPEN',
    priority: 'NORMAL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  sendTicketMessage: vi.fn(),
  updateTicketStatus: vi.fn(),
}));

describe('SupportHelpPage (Screen 17)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Help Center heading and search box', async () => {
    render(<SupportHelpPage />);
    expect(screen.getByText('Help Center & Support')).toBeDefined();
    expect(screen.getByPlaceholderText('Search help articles...')).toBeDefined();
  });

  it('loads and displays knowledge base articles and categories', async () => {
    render(<SupportHelpPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Deliverables & Revisions').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('How Deliverable Approvals Work')).toBeDefined();
    });
  });

  it('loads and displays client support tickets', async () => {
    render(<SupportHelpPage />);
    await waitFor(() => {
      expect(screen.getByText('Your Support Tickets')).toBeDefined();
      expect(screen.getByText('Question on asset export format')).toBeDefined();
      expect(screen.getByText('TCK-2026-0001')).toBeDefined();
    });
  });

  it('opens CreateTicketModal when "Open New Ticket" is clicked', async () => {
    render(<SupportHelpPage />);
    const openBtn = screen.getByRole('button', { name: /open new ticket/i });
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByText('Open Support Ticket')).toBeDefined();
    });

    expect(screen.getByPlaceholderText(/Describe your inquiry/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /submit ticket/i })).toBeDefined();

    // Verify SLA compliance: No SLA promises exist in form or modal
    expect(screen.queryByText(/24 hours/i)).toBeNull();
    expect(screen.queryByText(/turnaround/i)).toBeNull();
    expect(screen.queryByText(/guaranteed response/i)).toBeNull();
  });
});

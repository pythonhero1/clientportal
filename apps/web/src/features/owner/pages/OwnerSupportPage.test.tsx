import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OwnerSupportPage } from './OwnerSupportPage';

vi.mock('../../../services/support-api', () => ({
  fetchOwnerTicketQueue: vi.fn().mockResolvedValue([
    {
      id: 'tck_owner_1',
      ticketNumber: 'TCK-2026-0001',
      clientId: 'usr_client_1',
      client: { id: 'usr_client_1', name: 'Acme Corp', email: 'acme@example.com' },
      subject: 'Urgent: Feedback on design mockups',
      status: 'WAITING_FOR_OWNER' as const,
      priority: 'HIGH' as const,
      project: { id: 'prj_1', name: 'Design System' },
      _count: { messages: 3 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]),
  fetchAdminHelpArticles: vi.fn().mockResolvedValue([
    {
      id: 'art_admin_1',
      categoryId: 'cat_1',
      category: { id: 'cat_1', name: 'Onboarding', slug: 'onboarding' },
      title: 'Client Onboarding Guide',
      slug: 'client-onboarding-guide',
      content: 'Welcome to the portal...',
      excerpt: 'Initial steps for new clients.',
      isPublished: true,
      publishedAt: new Date().toISOString(),
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]),
  fetchHelpCategories: vi.fn().mockResolvedValue([
    { id: 'cat_1', name: 'Onboarding', slug: 'onboarding', orderIndex: 0 },
  ]),
  fetchTicketDetails: vi.fn().mockResolvedValue({
    id: 'tck_owner_1',
    ticketNumber: 'TCK-2026-0001',
    clientId: 'usr_client_1',
    client: { id: 'usr_client_1', name: 'Acme Corp', email: 'acme@example.com' },
    subject: 'Urgent: Feedback on design mockups',
    status: 'WAITING_FOR_OWNER',
    priority: 'HIGH',
    messages: [],
  }),
  triageTicket: vi.fn(),
  sendOwnerReply: vi.fn(),
  createAdminHelpArticle: vi.fn(),
  updateAdminHelpArticle: vi.fn(),
  deleteAdminHelpArticle: vi.fn(),
}));

describe('OwnerSupportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders support queue heading and tabs', async () => {
    render(<OwnerSupportPage />);
    expect(screen.getByText('Client Support & Knowledge Base')).toBeDefined();
    expect(screen.getByText('Support Tickets Queue')).toBeDefined();
    expect(screen.getByText('Knowledge Base Management')).toBeDefined();
  });

  it('displays tickets in queue with action required status', async () => {
    render(<OwnerSupportPage />);
    await waitFor(() => {
      expect(screen.getByText('Urgent: Feedback on design mockups')).toBeDefined();
      expect(screen.getByText('Action Required')).toBeDefined();
      expect(screen.getByText('Acme Corp')).toBeDefined();
    });
  });

  it('switches to knowledge base tab and displays articles', async () => {
    render(<OwnerSupportPage />);
    const kbTab = screen.getByText('Knowledge Base Management');
    fireEvent.click(kbTab);

    await waitFor(() => {
      expect(screen.getByText('New Article')).toBeDefined();
      expect(screen.getByText('Client Onboarding Guide')).toBeDefined();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoicesPage } from './InvoicesPage.js';
import * as invoicesApi from '../../../services/invoices-api.js';
import * as projectsApi from '../../../services/projects-api.js';

vi.mock('../../../services/invoices-api.js', () => ({
  fetchProjectInvoices: vi.fn(),
  downloadInvoicePdf: vi.fn(),
  submitPaymentEvidence: vi.fn(),
}));

vi.mock('../../../services/projects-api.js', () => ({
  fetchProjects: vi.fn(),
  getActivePersona: vi.fn(() => ({ id: 'client_1', name: 'Alpha Client', role: 'Client' })),
  getAuthHeaders: vi.fn(() => ({})),
}));

describe('InvoicesPage (Screen 11 - Figma 4:508)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (projectsApi.fetchProjects as any).mockResolvedValue([
      { id: 'proj_alpha', name: 'Alpha Brand Platform' },
    ]);
  });

  it('renders live invoice cards with status badge, serial number, and totals', async () => {
    (invoicesApi.fetchProjectInvoices as any).mockResolvedValue([
      {
        id: 'inv_1',
        invoiceNumber: 'INV-2026-0001',
        projectId: 'proj_alpha',
        clientId: 'client_1',
        status: 'ISSUED',
        currency: 'USD',
        subtotal: '2000.00',
        taxRate: '7.50',
        taxAmount: '150.00',
        totalAmount: '2150.00',
        amountPaid: '0.00',
        dueDate: '2026-11-15T00:00:00.000Z',
        issuedAt: '2026-10-18T00:00:00.000Z',
        notes: 'Deposit for Architecture & Design Tokens',
        items: [
          { id: 'item_1', description: 'System Architecture', quantity: 1, unitPrice: 2000, amount: 2000 },
        ],
        payments: [],
      },
    ]);

    render(<InvoicesPage />);

    expect(await screen.findByText('Invoices & Billing')).toBeInTheDocument();
    expect(await screen.findByText('INV-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('ISSUED')).toBeInTheDocument();
    expect(screen.getByText('$2,150.00')).toBeInTheDocument();
    expect(screen.getByText('Deposit for Architecture & Design Tokens')).toBeInTheDocument();
  });

  it('renders designated billing contact restriction card when unauthorized', async () => {
    (invoicesApi.fetchProjectInvoices as any).mockRejectedValue(new Error('NOT_BILLING_CONTACT'));

    render(<InvoicesPage />);

    expect(await screen.findByText('Designated Billing Contact Required')).toBeInTheDocument();
    expect(
      screen.getByText(/Billing information, financial ledgers, and official PDF statements are restricted/),
    ).toBeInTheDocument();
  });

  it('opens invoice detail modal and bank transfer instructions dialog', async () => {
    (invoicesApi.fetchProjectInvoices as any).mockResolvedValue([
      {
        id: 'inv_2',
        invoiceNumber: 'INV-2026-0002',
        projectId: 'proj_alpha',
        clientId: 'client_1',
        status: 'ISSUED',
        currency: 'USD',
        subtotal: '1000.00',
        taxRate: '0.00',
        taxAmount: '0.00',
        totalAmount: '1000.00',
        amountPaid: '0.00',
        dueDate: '2026-11-20T00:00:00.000Z',
        issuedAt: '2026-10-18T00:00:00.000Z',
        notes: 'Design System Sprint',
        items: [
          { id: 'it_1', description: 'Component Library Deliverable', quantity: 1, unitPrice: 1000, amount: 1000 },
        ],
        payments: [],
      },
    ]);

    render(<InvoicesPage />);

    expect(await screen.findByText('INV-2026-0002', {}, { timeout: 4000 })).toBeInTheDocument();
    const detailsBtn = await screen.findByRole('button', { name: /Details/i }, { timeout: 4000 });
    fireEvent.click(detailsBtn);

    expect(await screen.findByText('Itemized Deliverables & Scope')).toBeInTheDocument();
    expect(screen.getByText('Component Library Deliverable')).toBeInTheDocument();

    const bankDetailsBtn = screen.getByRole('button', { name: /Bank Details/i });
    fireEvent.click(bankDetailsBtn);

    expect(await screen.findByText('Bank Remittance Details')).toBeInTheDocument();
    expect(screen.getByText('Access Bank Plc')).toBeInTheDocument();
  });
});

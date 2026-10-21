import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OwnerInvoicesPage } from './OwnerInvoicesPage.js';
import * as invoicesApi from '../../../services/invoices-api.js';

vi.mock('../../../services/invoices-api.js', () => ({
  fetchOwnerLedger: vi.fn(),
  createDraftInvoice: vi.fn(),
  issueInvoice: vi.fn(),
  recordOwnerPayment: vi.fn(),
  cancelInvoice: vi.fn(),
  previewOwnerInvoicePdf: vi.fn(),
}));

describe('OwnerInvoicesPage (Owner Billing Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders billing ledger with status pills, totals, and invoices', async () => {
    (invoicesApi.fetchOwnerLedger as any).mockResolvedValue([
      {
        id: 'inv_draft_1',
        invoiceNumber: null,
        projectId: 'proj_alpha',
        clientId: 'client_a',
        status: 'DRAFT',
        currency: 'USD',
        subtotal: '3000.00',
        taxRate: '0.00',
        taxAmount: '0.00',
        totalAmount: '3000.00',
        amountPaid: '0.00',
        dueDate: '2026-11-20T00:00:00.000Z',
        items: [{ id: 'it_1', description: 'Phase 1 MVP', quantity: 1, unitPrice: 3000, amount: 3000 }],
        payments: [],
      },
    ]);

    render(<OwnerInvoicesPage />);

    expect(await screen.findByText('Billing & Invoices')).toBeInTheDocument();
    expect(await screen.findByText('UNISSUED DRAFT')).toBeInTheDocument();
    expect(screen.getAllByText('DRAFT').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$3,000.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Issue New Invoice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Issue$/i })).toBeInTheDocument();
  });

  it('opens Create Invoice modal when clicking Issue New Invoice', async () => {
    (invoicesApi.fetchOwnerLedger as any).mockResolvedValue([]);

    render(<OwnerInvoicesPage />);

    const openBtn = await screen.findByRole('button', { name: /Issue New Invoice/i });
    fireEvent.click(openBtn);

    expect(await screen.findByText('Issue New Itemized Invoice')).toBeInTheDocument();
    expect(screen.getByText('Line Items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Draft Invoice/i })).toBeInTheDocument();
  });
});

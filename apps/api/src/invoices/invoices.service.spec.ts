import { describe, it, expect, beforeEach } from 'vitest';
import { InvoicesService } from './services/invoices.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoiceStatus, PaymentMethod, PaymentRecordStatus } from '@prisma/client';

describe('InvoicesService (Unit)', () => {
  let service: InvoicesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {};
    service = new InvoicesService(prismaMock as PrismaService);
  });

  describe('Decimal Calculations & Draft Creation', () => {
    it('computes exact subtotal, 7.5% tax, and total without floating point drift', async () => {
      const draft = await service.createDraft('owner_1', {
        projectId: 'proj_1',
        clientId: 'client_1',
        currency: 'USD',
        dueDate: '2026-11-15T00:00:00.000Z',
        taxRate: 7.5,
        items: [
          { description: 'Initial Milestone: System Architecture', quantity: 1, unitPrice: 1500.0 },
          { description: 'Consulting & Design Tokens', quantity: 2, unitPrice: 250.0 },
        ],
      });

      // 1500 + 500 = 2000.00
      expect(draft.subtotal).toBe('2000.00');
      // 2000 * 7.5% = 150.00
      expect(draft.taxAmount).toBe('150.00');
      // 2000 + 150 = 2150.00
      expect(draft.totalAmount).toBe('2150.00');
      expect(draft.status).toBe(InvoiceStatus.DRAFT);
      expect(draft.invoiceNumber).toBeNull();
      expect(draft.items.length).toBe(2);
    });
  });

  describe('Invoice Issuance & Sequential Numbering', () => {
    it('issues a draft invoice and allocates a sequential unique serial number', async () => {
      const draft = await service.createDraft('owner_1', {
        projectId: 'proj_1',
        clientId: 'client_1',
        dueDate: '2026-11-01T00:00:00.000Z',
        items: [{ description: 'Feature Milestone', quantity: 1, unitPrice: 1000.0 }],
      });

      const issued = await service.issueInvoice(draft.id);
      expect(issued.status).toBe(InvoiceStatus.ISSUED);
      expect(issued.issuedAt).toBeDefined();
      expect(issued.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('rejects issuing an invoice that is already issued', async () => {
      const draft = await service.createDraft('owner_1', {
        projectId: 'proj_1',
        clientId: 'client_1',
        dueDate: '2026-11-01T00:00:00.000Z',
        items: [{ description: 'Item 1', quantity: 1, unitPrice: 500.0 }],
      });

      await service.issueInvoice(draft.id);
      await expect(service.issueInvoice(draft.id)).rejects.toThrow('Only DRAFT invoices can be issued.');
    });
  });

  describe('Payment Settlement & Status Progression', () => {
    it('records partial payment and updates status to PARTIALLY_PAID', async () => {
      const draft = await service.createDraft('owner_1', {
        projectId: 'proj_1',
        clientId: 'client_1',
        dueDate: '2026-11-01T00:00:00.000Z',
        items: [{ description: 'Project Phase', quantity: 1, unitPrice: 2000.0 }],
      });
      const issued = await service.issueInvoice(draft.id);

      const updated = await service.recordPayment(issued.id, 'owner_1', {
        amount: 800.0,
        method: PaymentMethod.BANK_TRANSFER,
        reference: 'WIRE-889922',
      });

      expect(updated.status).toBe(InvoiceStatus.PARTIALLY_PAID);
      expect(updated.amountPaid).toBe('800.00');
      expect(updated.paidAt).toBeNull();
      expect(updated.payments.length).toBe(1);
      expect(updated.payments[0].status).toBe(PaymentRecordStatus.CONFIRMED);
    });

    it('transitions to PAID and stamps paidAt when settled in full', async () => {
      const draft = await service.createDraft('owner_1', {
        projectId: 'proj_1',
        clientId: 'client_1',
        dueDate: '2026-11-01T00:00:00.000Z',
        items: [{ description: 'Project Phase', quantity: 1, unitPrice: 1000.0 }],
      });
      const issued = await service.issueInvoice(draft.id);

      const settled = await service.recordPayment(issued.id, 'owner_1', {
        amount: 1000.0,
        method: PaymentMethod.BANK_TRANSFER,
        reference: 'WIRE-1000-FULL',
      });

      expect(settled.status).toBe(InvoiceStatus.PAID);
      expect(settled.amountPaid).toBe('1000.00');
      expect(settled.paidAt).toBeDefined();
    });
  });

  describe('Client Payment Evidence & Anti-Enumeration Scoping', () => {
    it('allows client to submit payment reference, creating PENDING record', async () => {
      const draft = await service.createDraft('owner_1', {
        projectId: 'proj_1',
        clientId: 'client_1',
        dueDate: '2026-11-01T00:00:00.000Z',
        items: [{ description: 'Design Sprint', quantity: 1, unitPrice: 1200.0 }],
      });
      const issued = await service.issueInvoice(draft.id);

      const evidence = await service.submitPaymentEvidence(issued.id, 'client_1', {
        reference: 'TXN-CLIENT-999',
        evidenceNote: 'Transfer sent from Access Bank checking account',
      });

      expect(evidence.status).toBe(PaymentRecordStatus.PENDING);
      expect(evidence.reference).toBe('TXN-CLIENT-999');
    });

    it('hides DRAFT invoices from Client project queries', async () => {
      const draft = await service.createDraft('owner_1', {
        projectId: 'proj_secret',
        clientId: 'client_1',
        dueDate: '2026-11-01T00:00:00.000Z',
        items: [{ description: 'Private Draft', quantity: 1, unitPrice: 5000.0 }],
      });

      // Query as Client
      const clientView = await service.getInvoicesForProject('proj_secret', true);
      expect(clientView.find((i) => i.id === draft.id)).toBeUndefined();

      // Query as Owner
      const ownerView = await service.getInvoicesForProject('proj_secret', false);
      expect(ownerView.find((i) => i.id === draft.id)).toBeDefined();
    });
  });
});

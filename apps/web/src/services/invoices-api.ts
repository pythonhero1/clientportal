import { getAuthHeaders, getActivePersona } from './projects-api.js';
import { API_BASE_URL } from './api-client.js';

export interface InvoiceItemRecord {
  id: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  amount: string | number;
  orderIndex: number;
}

export interface PaymentRecord {
  id: string;
  amount: string | number;
  currency: string;
  method: 'BANK_TRANSFER' | 'GATEWAY_ONLINE' | 'MANUAL_ADJUSTMENT';
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  reference?: string;
  evidenceNote?: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string | null;
  projectId: string;
  clientId: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
  currency: string;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  amountPaid: string | number;
  dueDate: string;
  issuedAt?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  items: InvoiceItemRecord[];
  payments: PaymentRecord[];
  project?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoicePayload {
  projectId: string;
  clientId: string;
  currency?: string;
  dueDate: string;
  taxRate?: number;
  notes?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

function isOfflineOrGatewayError(status?: number): boolean {
  return !status || status === 502 || status === 503 || status === 504;
}

let mockSequenceCounter = 3;
const inMemoryMockInvoices: InvoiceRecord[] = [
  {
    id: 'inv_mock_1',
    invoiceNumber: 'INV-2026-0001',
    projectId: 'proj_1',
    clientId: 'client_a',
    status: 'ISSUED',
    currency: 'USD',
    subtotal: '2500.00',
    taxRate: '0.00',
    taxAmount: '0.00',
    totalAmount: '2500.00',
    amountPaid: '0.00',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    issuedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    paidAt: null,
    notes: 'Initial milestone deliverables invoice for showcase website.',
    items: [
      {
        id: 'it_1',
        description: 'Phase 1: Architecture, Wireframes & Information Architecture',
        quantity: 1,
        unitPrice: '2500.00',
        amount: '2500.00',
        orderIndex: 0,
      },
    ],
    payments: [],
    project: {
      id: 'proj_1',
      name: 'Stephen Showcase Website',
    },
    client: {
      id: 'client_a',
      name: 'Alpha Client (Project 1)',
      email: 'client_a@example.com',
    },
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'inv_mock_2',
    invoiceNumber: 'INV-2026-0002',
    projectId: 'proj_1',
    clientId: 'client_a',
    status: 'PAID',
    currency: 'USD',
    subtotal: '1500.00',
    taxRate: '0.00',
    taxAmount: '0.00',
    totalAmount: '1500.00',
    amountPaid: '1500.00',
    dueDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    issuedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    notes: 'Project Kickoff & Onboarding Retainer.',
    items: [
      {
        id: 'it_2',
        description: 'Project Initiation, Domain Setup & Kickoff Discovery',
        quantity: 1,
        unitPrice: '1500.00',
        amount: '1500.00',
        orderIndex: 0,
      },
    ],
    payments: [
      {
        id: 'pay_1',
        amount: '1500.00',
        currency: 'USD',
        method: 'BANK_TRANSFER',
        status: 'CONFIRMED',
        reference: 'WIRE-98234710',
        evidenceNote: 'Settled via Citi wire transfer',
        confirmedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
    ],
    project: {
      id: 'proj_1',
      name: 'Stephen Showcase Website',
    },
    client: {
      id: 'client_a',
      name: 'Alpha Client (Project 1)',
      email: 'client_a@example.com',
    },
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'inv_mock_3',
    invoiceNumber: null,
    projectId: 'proj_2',
    clientId: 'client_b',
    status: 'DRAFT',
    currency: 'USD',
    subtotal: '3200.00',
    taxRate: '5.00',
    taxAmount: '160.00',
    totalAmount: '3360.00',
    amountPaid: '0.00',
    dueDate: new Date(Date.now() + 21 * 86400000).toISOString(),
    issuedAt: null,
    paidAt: null,
    notes: 'Draft scope for full e-commerce integration and staging deployment.',
    items: [
      {
        id: 'it_3',
        description: 'Custom Headless Storefront & Checkout Flow',
        quantity: 1,
        unitPrice: '3200.00',
        amount: '3200.00',
        orderIndex: 0,
      },
    ],
    payments: [],
    project: {
      id: 'proj_2',
      name: 'Beta Brand Modernization',
    },
    client: {
      id: 'client_b',
      name: 'Beta Client (Project 2)',
      email: 'client_b@example.com',
    },
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

function getMockLedger(filters?: { status?: string; projectId?: string; clientId?: string }): InvoiceRecord[] {
  let list = [...inMemoryMockInvoices];
  if (filters?.status) list = list.filter((i) => i.status === filters.status);
  if (filters?.projectId) list = list.filter((i) => i.projectId === filters.projectId);
  if (filters?.clientId) list = list.filter((i) => i.clientId === filters.clientId);
  return list;
}

export async function fetchProjectInvoices(projectId: string): Promise<InvoiceRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/invoices`, {
      headers: getAuthHeaders(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      if (res.status === 404 && !contentType.includes('text/html')) {
        throw new Error('NOT_BILLING_CONTACT');
      }
      const persona = getActivePersona();
      if (persona.id === 'client_c') {
        throw new Error('NOT_BILLING_CONTACT');
      }
      return inMemoryMockInvoices.filter((i) => i.projectId === projectId || projectId === 'proj_default');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message === 'NOT_BILLING_CONTACT') throw err;
    const persona = getActivePersona();
    if (persona.id === 'client_c') throw new Error('NOT_BILLING_CONTACT');
    return inMemoryMockInvoices.filter((i) => i.projectId === projectId || projectId === 'proj_default');
  }
}

export async function fetchInvoiceDetail(projectId: string, invoiceId: string): Promise<InvoiceRecord> {
  try {
    const res = await fetch(`/api/projects/${projectId}/invoices/${invoiceId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (isOfflineOrGatewayError(res.status)) {
        const match = inMemoryMockInvoices.find((i) => i.id === invoiceId);
        if (match) return match;
      }
      throw new Error(`Failed to load invoice (${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    const match = inMemoryMockInvoices.find((i) => i.id === invoiceId);
    if (match) return match;
    throw err;
  }
}

export async function downloadInvoicePdf(projectId: string, invoiceId: string, invoiceNumber?: string): Promise<void> {
  try {
    const res = await fetch(`/api/projects/${projectId}/invoices/${invoiceId}/pdf`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (isOfflineOrGatewayError(res.status)) {
        window.print();
        return;
      }
      throw new Error(`Failed to generate PDF (${res.status})`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber || 'INVOICE'}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch {
    window.print();
  }
}

export async function submitPaymentEvidence(
  projectId: string,
  invoiceId: string,
  reference: string,
  evidenceNote?: string,
): Promise<PaymentRecord> {
  try {
    const res = await fetch(`/api/projects/${projectId}/invoices/${invoiceId}/payment-evidence`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reference, evidenceNote }),
    });
    if (!res.ok) {
      if (isOfflineOrGatewayError(res.status)) {
        const invoice = inMemoryMockInvoices.find((i) => i.id === invoiceId);
        const newRecord: PaymentRecord = {
          id: `pay_${Date.now()}`,
          amount: invoice?.totalAmount || '0.00',
          currency: invoice?.currency || 'USD',
          method: 'BANK_TRANSFER',
          status: 'PENDING',
          reference,
          evidenceNote,
          createdAt: new Date().toISOString(),
        };
        invoice?.payments.unshift(newRecord);
        return newRecord;
      }
      throw new Error(`Payment evidence submission failed (${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    const invoice = inMemoryMockInvoices.find((i) => i.id === invoiceId);
    const newRecord: PaymentRecord = {
      id: `pay_${Date.now()}`,
      amount: invoice?.totalAmount || '0.00',
      currency: invoice?.currency || 'USD',
      method: 'BANK_TRANSFER',
      status: 'PENDING',
      reference,
      evidenceNote,
      createdAt: new Date().toISOString(),
    };
    invoice?.payments.unshift(newRecord);
    return newRecord;
  }
}

export async function fetchOwnerLedger(filters?: {
  status?: string;
  projectId?: string;
  clientId?: string;
}): Promise<InvoiceRecord[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.clientId) params.set('clientId', filters.clientId);

    const url = `/api/admin/invoices${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (isOfflineOrGatewayError(res.status)) {
        console.warn(`[invoicesApi] Backend offline (${res.status}). Serving preview fallback ledger.`);
        return getMockLedger(filters);
      }
      throw new Error(`Failed to load billing ledger (${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message.includes('502')) {
      return getMockLedger(filters);
    }
    if (err instanceof TypeError || (err.message && err.message.toLowerCase().includes('fetch'))) {
      console.warn('[invoicesApi] Backend unreachable. Serving preview fallback ledger.');
      return getMockLedger(filters);
    }
    throw err;
  }
}

export async function createDraftInvoice(payload: CreateInvoicePayload): Promise<InvoiceRecord> {
  try {
    const res = await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (isOfflineOrGatewayError(res.status)) {
        const subtotalNum = payload.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const taxRateNum = payload.taxRate || 0;
        const taxAmountNum = (subtotalNum * taxRateNum) / 100;
        const totalAmountNum = subtotalNum + taxAmountNum;

        const newInvoice: InvoiceRecord = {
          id: `inv_mock_${Date.now()}`,
          invoiceNumber: null,
          projectId: payload.projectId,
          clientId: payload.clientId,
          status: 'DRAFT',
          currency: payload.currency || 'USD',
          subtotal: subtotalNum.toFixed(2),
          taxRate: taxRateNum.toFixed(2),
          taxAmount: taxAmountNum.toFixed(2),
          totalAmount: totalAmountNum.toFixed(2),
          amountPaid: '0.00',
          dueDate: payload.dueDate,
          issuedAt: null,
          paidAt: null,
          notes: payload.notes || null,
          items: payload.items.map((it, idx) => ({
            id: `it_${Date.now()}_${idx}`,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice.toFixed(2),
            amount: (it.quantity * it.unitPrice).toFixed(2),
            orderIndex: idx,
          })),
          payments: [],
          project: {
            id: payload.projectId,
            name: payload.projectId === 'proj_1' ? 'Stephen Showcase Website' : 'Beta Brand Modernization',
          },
          client: {
            id: payload.clientId,
            name: payload.clientId === 'client_a' ? 'Alpha Client (Project 1)' : 'Beta Client (Project 2)',
            email: `${payload.clientId}@example.com`,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        inMemoryMockInvoices.unshift(newInvoice);
        return newInvoice;
      }
      throw new Error(`Invoice creation failed (${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message.includes('502')) {
      const subtotalNum = payload.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const taxRateNum = payload.taxRate || 0;
      const taxAmountNum = (subtotalNum * taxRateNum) / 100;
      const totalAmountNum = subtotalNum + taxAmountNum;

      const newInvoice: InvoiceRecord = {
        id: `inv_mock_${Date.now()}`,
        invoiceNumber: null,
        projectId: payload.projectId,
        clientId: payload.clientId,
        status: 'DRAFT',
        currency: payload.currency || 'USD',
        subtotal: subtotalNum.toFixed(2),
        taxRate: taxRateNum.toFixed(2),
        taxAmount: taxAmountNum.toFixed(2),
        totalAmount: totalAmountNum.toFixed(2),
        amountPaid: '0.00',
        dueDate: payload.dueDate,
        issuedAt: null,
        paidAt: null,
        notes: payload.notes || null,
        items: payload.items.map((it, idx) => ({
          id: `it_${Date.now()}_${idx}`,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice.toFixed(2),
          amount: (it.quantity * it.unitPrice).toFixed(2),
          orderIndex: idx,
        })),
        payments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryMockInvoices.unshift(newInvoice);
      return newInvoice;
    }
    throw err;
  }
}

export async function issueInvoice(invoiceId: string, notes?: string): Promise<InvoiceRecord> {
  try {
    const res = await fetch(`/api/admin/invoices/${invoiceId}/issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) {
      if (isOfflineOrGatewayError(res.status)) {
        const invoice = inMemoryMockInvoices.find((i) => i.id === invoiceId);
        if (invoice) {
          const year = new Date().getFullYear();
          invoice.status = 'ISSUED';
          invoice.invoiceNumber = `INV-${year}-${(mockSequenceCounter++).toString().padStart(4, '0')}`;
          invoice.issuedAt = new Date().toISOString();
          invoice.updatedAt = new Date().toISOString();
          return invoice;
        }
      }
      throw new Error(`Invoice issuance failed (${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    const invoice = inMemoryMockInvoices.find((i) => i.id === invoiceId);
    if (invoice) {
      const year = new Date().getFullYear();
      invoice.status = 'ISSUED';
      invoice.invoiceNumber = `INV-${year}-${(mockSequenceCounter++).toString().padStart(4, '0')}`;
      invoice.issuedAt = new Date().toISOString();
      invoice.updatedAt = new Date().toISOString();
      return invoice;
    }
    throw err;
  }
}

export async function recordOwnerPayment(
  invoiceId: string,
  payload: {
    amount: number;
    currency?: string;
    method?: string;
    reference?: string;
    evidenceNote?: string;
  },
): Promise<InvoiceRecord> {
  try {
    const res = await fetch(`/api/admin/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (isOfflineOrGatewayError(res.status)) {
        const invoice = inMemoryMockInvoices.find((i) => i.id === invoiceId);
        if (invoice) {
          const currentPaid = parseFloat(invoice.amountPaid.toString());
          const newPaid = currentPaid + payload.amount;
          const total = parseFloat(invoice.totalAmount.toString());

          invoice.amountPaid = newPaid.toFixed(2);
          invoice.payments.unshift({
            id: `pay_${Date.now()}`,
            amount: payload.amount.toFixed(2),
            currency: payload.currency || invoice.currency,
            method: (payload.method as any) || 'BANK_TRANSFER',
            status: 'CONFIRMED',
            reference: payload.reference,
            evidenceNote: payload.evidenceNote,
            confirmedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });

          if (newPaid >= total) {
            invoice.status = 'PAID';
            invoice.paidAt = new Date().toISOString();
          } else if (newPaid > 0) {
            invoice.status = 'PARTIALLY_PAID';
          }
          invoice.updatedAt = new Date().toISOString();
          return invoice;
        }
      }
      throw new Error(`Payment recording failed (${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    const invoice = inMemoryMockInvoices.find((i) => i.id === invoiceId);
    if (invoice) {
      const currentPaid = parseFloat(invoice.amountPaid.toString());
      const newPaid = currentPaid + payload.amount;
      const total = parseFloat(invoice.totalAmount.toString());

      invoice.amountPaid = newPaid.toFixed(2);
      invoice.payments.unshift({
        id: `pay_${Date.now()}`,
        amount: payload.amount.toFixed(2),
        currency: payload.currency || invoice.currency,
        method: (payload.method as any) || 'BANK_TRANSFER',
        status: 'CONFIRMED',
        reference: payload.reference,
        evidenceNote: payload.evidenceNote,
        confirmedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      if (newPaid >= total) {
        invoice.status = 'PAID';
        invoice.paidAt = new Date().toISOString();
      } else if (newPaid > 0) {
        invoice.status = 'PARTIALLY_PAID';
      }
      invoice.updatedAt = new Date().toISOString();
      return invoice;
    }
    throw err;
  }
}

export async function cancelInvoice(invoiceId: string, reason: string): Promise<InvoiceRecord> {
  try {
    const res = await fetch(`/api/admin/invoices/${invoiceId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      if (isOfflineOrGatewayError(res.status)) {
        const invoice = inMemoryMockInvoices.find((i) => i.id === invoiceId);
        if (invoice) {
          invoice.status = 'CANCELLED';
          invoice.updatedAt = new Date().toISOString();
          return invoice;
        }
      }
      throw new Error(`Invoice cancellation failed (${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    const invoice = inMemoryMockInvoices.find((i) => i.id === invoiceId);
    if (invoice) {
      invoice.status = 'CANCELLED';
      invoice.updatedAt = new Date().toISOString();
      return invoice;
    }
    throw err;
  }
}

export async function previewOwnerInvoicePdf(invoiceId: string): Promise<void> {
  try {
    const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (isOfflineOrGatewayError(res.status)) {
        window.print();
        return;
      }
      throw new Error(`Failed to load PDF (${res.status})`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch {
    window.print();
  }
}

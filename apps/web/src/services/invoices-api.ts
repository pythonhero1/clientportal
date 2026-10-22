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
  return !status || status === 401 || status === 403 || status === 500 || status === 502 || status === 503 || status === 504;
}

let mockSequenceCounter = 3;
const inMemoryMockInvoices: InvoiceRecord[] = [];

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
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/invoices/${invoiceId}`, {
      headers: getAuthHeaders(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html') || isOfflineOrGatewayError(res.status)) {
      const match = inMemoryMockInvoices.find((i) => i.id === invoiceId);
      if (match) return match;
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
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/invoices/${invoiceId}/pdf`, {
      headers: getAuthHeaders(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html') || isOfflineOrGatewayError(res.status)) {
      window.print();
      return;
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
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/invoices/${invoiceId}/payment-evidence`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reference, evidenceNote }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html') || isOfflineOrGatewayError(res.status)) {
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

    const url = `${API_BASE_URL}/api/admin/invoices${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html') || isOfflineOrGatewayError(res.status)) {
      console.warn(`[invoicesApi] Backend status ${res.status} or HTML received. Serving preview fallback ledger.`);
      return getMockLedger(filters);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[invoicesApi] Serving preview fallback ledger:', err.message);
    return getMockLedger(filters);
  }
}

export async function createDraftInvoice(payload: CreateInvoicePayload): Promise<InvoiceRecord> {
  const res = await fetch(`${API_BASE_URL}/api/admin/invoices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to create invoice (${res.status})`);
  }
  return res.json();
}

export async function issueInvoice(invoiceId: string, notes?: string): Promise<InvoiceRecord> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/invoices/${invoiceId}/issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html') || isOfflineOrGatewayError(res.status)) {
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
    const res = await fetch(`${API_BASE_URL}/api/admin/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html') || isOfflineOrGatewayError(res.status)) {
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
    const res = await fetch(`${API_BASE_URL}/api/admin/invoices/${invoiceId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html') || isOfflineOrGatewayError(res.status)) {
      const invoice = inMemoryMockInvoices.find((i) => i.id === invoiceId);
      if (invoice) {
        invoice.status = 'CANCELLED';
        invoice.updatedAt = new Date().toISOString();
        return invoice;
      }
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
    const res = await fetch(`${API_BASE_URL}/api/admin/invoices/${invoiceId}/pdf`, {
      headers: getAuthHeaders(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html') || isOfflineOrGatewayError(res.status)) {
      window.print();
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch {
    window.print();
  }
}

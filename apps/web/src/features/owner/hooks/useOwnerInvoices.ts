import { useState, useEffect, useCallback } from 'react';
import {
  fetchOwnerLedger,
  createDraftInvoice,
  issueInvoice,
  recordOwnerPayment,
  cancelInvoice,
} from '../../../services/invoices-api.js';
import type { InvoiceRecord, CreateInvoicePayload } from '../../../services/invoices-api.js';

export function useOwnerInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOwnerLedger(statusFilter ? { status: statusFilter } : undefined);
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing ledger.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const handleCreateDraft = async (payload: CreateInvoicePayload) => {
    const created = await createDraftInvoice(payload);
    await loadLedger();
    return created;
  };

  const handleIssue = async (invoiceId: string, notes?: string) => {
    const issued = await issueInvoice(invoiceId, notes);
    await loadLedger();
    return issued;
  };

  const handleRecordPayment = async (
    invoiceId: string,
    payload: { amount: number; currency?: string; method?: string; reference?: string; evidenceNote?: string },
  ) => {
    const updated = await recordOwnerPayment(invoiceId, payload);
    await loadLedger();
    return updated;
  };

  const handleCancel = async (invoiceId: string, reason: string) => {
    const cancelled = await cancelInvoice(invoiceId, reason);
    await loadLedger();
    return cancelled;
  };

  return {
    invoices,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refetch: loadLedger,
    createDraft: handleCreateDraft,
    issue: handleIssue,
    recordPayment: handleRecordPayment,
    cancel: handleCancel,
  };
}

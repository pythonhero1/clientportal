import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button.js';
import type { InvoiceRecord } from '../../../services/invoices-api.js';
import { AlertTriangle, X, AlertCircle } from 'lucide-react';

interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRecord | null;
  onSubmit: (invoiceId: string, reason: string) => Promise<any>;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a cancellation reason for the audit ledger.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(invoice.id, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden text-left">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">Cancel / Void Invoice</h2>
              <p className="text-xs text-[var(--muted-text)]">Invoice {invoice.invoiceNumber || invoice.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-[var(--muted-text)] leading-relaxed">
            Voiding an invoice marks it as <span className="font-semibold text-red-500">CANCELLED</span>. Its allocated serial number will remain preserved on the audit ledger and cannot be reissued.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Cancellation Justification *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Scope adjusted, superseded by revised deliverable schedule"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Keep Invoice
            </Button>
            <Button type="submit" variant="danger" disabled={submitting}>
              {submitting ? 'Voiding...' : 'Confirm Void'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

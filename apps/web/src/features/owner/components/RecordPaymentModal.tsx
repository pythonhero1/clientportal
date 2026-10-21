import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button.js';
import type { InvoiceRecord } from '../../../services/invoices-api.js';
import { CreditCard, X, AlertCircle } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRecord | null;
  onSubmit: (invoiceId: string, payload: any) => Promise<any>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<'BANK_TRANSFER' | 'GATEWAY_ONLINE' | 'MANUAL_ADJUSTMENT'>('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (invoice) {
      const balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);
      setAmount(balance > 0 ? balance : Number(invoice.totalAmount));
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Please provide a valid settlement amount.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(invoice.id, {
        amount: Number(amount),
        currency: invoice.currency,
        method,
        reference: reference.trim() || undefined,
        evidenceNote: evidenceNote.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden text-left">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">Record Settlement</h2>
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

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Settlement Amount ({invoice.currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Collection Channel</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="BANK_TRANSFER">Direct Bank Wire / Remittance</option>
              <option value="GATEWAY_ONLINE">Online Gateway Settlement</option>
              <option value="MANUAL_ADJUSTMENT">Manual Credit / Balance Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Bank Ref / Transaction ID
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TXN-WIRE-992211"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
              Audit Notes / Verification Memo
            </label>
            <input
              type="text"
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="e.g. Verified credited in corporate account"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Confirming...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

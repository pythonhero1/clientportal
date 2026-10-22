import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button.js';
import { submitPaymentEvidence } from '../../../services/invoices-api.js';
import type { InvoiceRecord } from '../../../services/invoices-api.js';
import { UploadCloud, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface SubmitPaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRecord | null;
  onSubmitted: () => void;
}

export const SubmitPaymentProofModal: React.FC<SubmitPaymentProofModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmitted,
}) => {
  const [reference, setReference] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError('Please provide a bank transfer reference number.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitPaymentEvidence(invoice.projectId, invoice.id, reference.trim(), evidenceNote.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReference('');
        setEvidenceNote('');
        onSubmitted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment evidence.');
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
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">Submit Payment Reference</h2>
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

        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h3 className="text-base font-bold text-[var(--text)]">Payment Memo Submitted!</h3>
            <p className="text-xs text-[var(--muted-text)]">
              Our billing desk has been notified and will verify the incoming transfer.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                Bank Transfer Reference / Transaction ID *
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                Additional Notes / Originating Bank (Optional)
              </label>
              <textarea
                rows={3}
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Evidence'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

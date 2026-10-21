import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button.js';
import { Landmark, Copy, Check, X } from 'lucide-react';

interface PaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber?: string | null;
}

export const PaymentInstructionsModal: React.FC<PaymentInstructionsModalProps> = ({
  isOpen,
  onClose,
  invoiceNumber,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const bankDetails = [
    { label: 'Bank Name', value: 'Access Bank Plc' },
    { label: 'Account Name', value: 'Oderinde Stephen' },
    { label: 'Account Number', value: '0123456789' },
    { label: 'SWIFT / BIC Code', value: 'ACCNGLLA' },
    { label: 'Payment Reference', value: invoiceNumber || 'INV-2026-0001' },
  ];

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden text-left">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)]">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">Bank Remittance Details</h2>
              <p className="text-xs text-[var(--muted-text)]">Direct wire transfer instructions</p>
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

        <div className="p-6 space-y-4">
          <p className="text-xs text-[var(--muted-text)]">
            Please include the exact payment reference in your transfer memo so our billing desk can automatically reconcile and confirm your payment.
          </p>

          <div className="space-y-2.5">
            {bankDetails.map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between"
              >
                <div>
                  <span className="text-[0.6875rem] font-semibold text-[var(--muted-text)] uppercase tracking-wider block">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-[var(--text)] mt-0.5 block">{item.value}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(item.label, item.value)}
                  leftIcon={copiedField === item.label ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedField === item.label ? 'Copied' : 'Copy'}
                </Button>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--primary-subtle)]/20 border border-[var(--primary)]/30 text-xs text-[var(--text)]">
            <span className="font-semibold text-[var(--primary)]">Processing note: </span>
            Wire transfers typically settle within 1–2 business days. Once initiated, you can submit your reference number to track verification.
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Badge } from '../../../components/ui/Badge.js';
import { Button } from '../../../components/ui/Button.js';
import { downloadInvoicePdf } from '../../../services/invoices-api.js';
import type { InvoiceRecord } from '../../../services/invoices-api.js';
import { Receipt, Download, Landmark, UploadCloud, X, CheckCircle, Clock } from 'lucide-react';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRecord | null;
  onOpenBankDetails: () => void;
  onOpenPaymentProof: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onOpenBankDetails,
  onOpenPaymentProof,
}) => {
  if (!isOpen || !invoice) return null;

  const currencySymbol = invoice.currency === 'NGN' ? '₦' : '$';
  const formatMoney = (val: string | number) => {
    const num = typeof val === 'number' ? val : parseFloat(val.toString());
    return `${currencySymbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const balanceDue = (Number(invoice.totalAmount) - Number(invoice.amountPaid)).toFixed(2);
  const isPaid = invoice.status === 'PAID';

  const handleDownloadPdf = async () => {
    try {
      await downloadInvoicePdf(invoice.projectId, invoice.id, invoice.invoiceNumber || invoice.id);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text)]">
                  {invoice.invoiceNumber || 'Draft Invoice'}
                </h2>
                <Badge
                  variant={isPaid ? 'success' : invoice.status === 'PARTIALLY_PAID' ? 'accent' : 'neutral'}
                  size="sm"
                >
                  {invoice.status}
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Issued: {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : 'Pending'} • Due: {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
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

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Line Items Table */}
          <div>
            <h3 className="text-xs font-bold text-[var(--muted-text)] uppercase tracking-wider mb-2.5">
              Itemized Deliverables & Scope
            </h3>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-raised)] text-[var(--muted-text)] border-b border-[var(--border)]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Description</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-raised)]/50">
                        <td className="py-2.5 px-3">{item.description}</td>
                        <td className="py-2.5 px-3 text-right">{Number(item.quantity).toFixed(0)}</td>
                        <td className="py-2.5 px-3 text-right">{formatMoney(item.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{formatMoney(item.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[var(--muted-text)]">
                        No line items recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-[var(--muted-text)]">
              {invoice.notes && (
                <p>
                  <span className="font-semibold text-[var(--text)]">Notes: </span>
                  {invoice.notes}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:text-right shrink-0 min-w-[200px] text-xs">
              <div className="flex justify-between text-[var(--muted-text)]">
                <span>Subtotal:</span>
                <span>{formatMoney(invoice.subtotal)}</span>
              </div>
              {Number(invoice.taxRate) > 0 && (
                <div className="flex justify-between text-[var(--muted-text)]">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span>{formatMoney(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[var(--text)] pt-1 border-t border-[var(--border)]">
                <span>Total Amount:</span>
                <span>{formatMoney(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-green-500 font-medium">
                <span>Amount Paid:</span>
                <span>{formatMoney(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[var(--primary)] pt-1 border-t border-[var(--border)]">
                <span>Balance Due:</span>
                <span className={Number(balanceDue) > 0 ? 'text-red-500' : 'text-green-500'}>
                  {formatMoney(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History / Evidence Records */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[var(--muted-text)] uppercase tracking-wider mb-2.5">
                Payment History & Evidence Records
              </h3>
              <div className="space-y-2">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {p.status === 'CONFIRMED' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text)]">{formatMoney(p.amount)}</span>
                          <Badge variant={p.status === 'CONFIRMED' ? 'success' : 'neutral'} size="sm">
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-[0.6875rem] text-[var(--muted-text)] mt-0.5">
                          Ref: {p.reference || 'N/A'} • {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[var(--surface-raised)]/30">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Landmark className="w-4 h-4" />}
              onClick={onOpenBankDetails}
            >
              Bank Details
            </Button>
            {!isPaid && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<UploadCloud className="w-4 h-4" />}
                onClick={onOpenPaymentProof}
              >
                Submit Transfer Memo
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card.js';
import { Badge } from '../../../components/ui/Badge.js';
import { Button } from '../../../components/ui/Button.js';
import { useInvoices } from '../hooks/useInvoices.js';
import { downloadInvoicePdf } from '../../../services/invoices-api.js';
import type { InvoiceRecord } from '../../../services/invoices-api.js';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal.js';
import { PaymentInstructionsModal } from '../components/PaymentInstructionsModal.js';
import { SubmitPaymentProofModal } from '../components/SubmitPaymentProofModal.js';
import { Receipt, Download, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const {
    invoices,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    loading,
    error,
    isNotBillingContact,
    refetch,
  } = useInvoices();

  const [activeInvoice, setActiveInvoice] = useState<InvoiceRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string | null>(null);

  const formatMoney = (amount: string | number, currency: string = 'USD') => {
    const symbol = currency === 'NGN' ? '₦' : '$';
    const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleOpenDetail = (inv: InvoiceRecord) => {
    setActiveInvoice(inv);
    setSelectedInvoiceNumber(inv.invoiceNumber);
    setDetailModalOpen(true);
  };

  const handleDownloadPdf = async (inv: InvoiceRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await downloadInvoicePdf(inv.projectId, inv.id, inv.invoiceNumber || inv.id);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Invoices & Billing
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            View issued milestone invoices, download official PDF statements, and inspect payment evidence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {projects.length > 1 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-medium text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Non-Billing Contact Restriction Boundary */}
      {isNotBillingContact ? (
        <Card className="p-8 border-amber-500/20 bg-amber-500/5">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-[var(--text)]">Designated Billing Contact Required</h2>
              <p className="text-sm text-[var(--muted-text)] max-w-2xl leading-relaxed">
                Billing information, financial ledgers, and official PDF statements are restricted to designated billing contacts on this project.
              </p>
              <p className="text-xs text-[var(--muted-text)]">
                If your role requires visibility into invoices, tax receipts, or payment settlements, please contact Stephen or your project administrator to be granted designated billing permissions.
              </p>
            </div>
          </div>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[var(--surface-raised)] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-red-500 border-red-500/20 bg-red-500/5">
          <p className="text-sm font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="mt-3">
            Retry Loading
          </Button>
        </Card>
      ) : invoices.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[var(--text)]">No Issued Invoices Yet</h2>
          <p className="text-xs text-[var(--muted-text)] max-w-md mx-auto">
            When milestone invoices or billing statements are formally issued for your project, they will appear here with official PDF downloads.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const isPaid = inv.status === 'PAID';
            const balanceDue = (Number(inv.totalAmount) - Number(inv.amountPaid)).toFixed(2);

            return (
              <Card
                key={inv.id}
                className="hover:border-[var(--primary)]/40 transition-all cursor-pointer"
                onClick={() => handleOpenDetail(inv)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0 mt-0.5">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[var(--text)]">
                          {inv.invoiceNumber || 'Draft'}
                        </span>
                        <Badge
                          variant={isPaid ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'accent' : 'neutral'}
                          size="sm"
                        >
                          {inv.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--muted-text)] mt-0.5">
                        {inv.notes || (inv.items && inv.items[0]?.description) || 'Milestone Deliverable Deposit'}
                      </p>
                      <p className="text-xs text-[var(--muted-text)] mt-1">
                        Issued: {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : 'Draft'} • Due:{' '}
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--border)]">
                    <div className="text-left sm:text-right">
                      <span className="text-lg font-bold text-[var(--text)] block">
                        {formatMoney(inv.totalAmount, inv.currency)}
                      </span>
                      {Number(balanceDue) > 0 ? (
                        <span className="text-[0.6875rem] font-semibold text-amber-500 block">
                          Balance: {formatMoney(balanceDue, inv.currency)}
                        </span>
                      ) : (
                        <span className="text-[0.6875rem] font-semibold text-green-500 block">
                          Settled in full
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        onClick={(e) => handleDownloadPdf(inv, e)}
                      >
                        PDF
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(inv);
                        }}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <InvoiceDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        invoice={activeInvoice}
        onOpenBankDetails={() => {
          setDetailModalOpen(false);
          setBankModalOpen(true);
        }}
        onOpenPaymentProof={() => {
          setDetailModalOpen(false);
          setProofModalOpen(true);
        }}
      />

      <PaymentInstructionsModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        invoiceNumber={selectedInvoiceNumber}
      />

      <SubmitPaymentProofModal
        isOpen={proofModalOpen}
        onClose={() => setProofModalOpen(false)}
        invoice={activeInvoice}
        onSubmitted={() => {
          refetch();
        }}
      />
    </div>
  );
};

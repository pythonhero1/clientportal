import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card.js';
import { Badge } from '../../../components/ui/Badge.js';
import { Button } from '../../../components/ui/Button.js';
import { useOwnerInvoices } from '../hooks/useOwnerInvoices.js';
import { previewOwnerInvoicePdf } from '../../../services/invoices-api.js';
import type { InvoiceRecord } from '../../../services/invoices-api.js';
import { CreateInvoiceModal } from '../components/CreateInvoiceModal.js';
import { RecordPaymentModal } from '../components/RecordPaymentModal.js';
import { CancelInvoiceModal } from '../components/CancelInvoiceModal.js';
import { PlusCircle, Receipt, CreditCard, Ban, Send, FileText, RefreshCw } from 'lucide-react';

export const OwnerInvoicesPage: React.FC = () => {
  const {
    invoices,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refetch,
    createDraft,
    issue,
    recordPayment,
    cancel,
  } = useOwnerInvoices();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceRecord | null>(null);

  const formatMoney = (val: string | number, currency: string = 'USD') => {
    const symbol = currency === 'NGN' ? '₦' : '$';
    const num = typeof val === 'number' ? val : parseFloat(val.toString());
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleOpenPayment = (inv: InvoiceRecord) => {
    setActiveInvoice(inv);
    setPaymentModalOpen(true);
  };

  const handleOpenCancel = (inv: InvoiceRecord) => {
    setActiveInvoice(inv);
    setCancelModalOpen(true);
  };

  const handleIssueInvoice = async (inv: InvoiceRecord) => {
    if (confirm(`Formally issue invoice ${inv.id}? This will allocate an immutable sequential serial number.`)) {
      try {
        await issue(inv.id);
      } catch (err: any) {
        alert(err.message || 'Failed to issue invoice.');
      }
    }
  };

  const handlePreviewPdf = async (inv: InvoiceRecord) => {
    try {
      await previewOwnerInvoicePdf(inv.id);
    } catch (err: any) {
      alert(err.message || 'Failed to generate PDF.');
    }
  };

  const statusOptions = ['', 'DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'];

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Billing & Invoices
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Generate itemized invoices, allocate sequential serial numbers, produce PDF statements, and record settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Issue New Invoice
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusOptions.map((st) => (
          <button
            key={st || 'all'}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all uppercase shrink-0 ${
              statusFilter === st
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-raised)] text-[var(--muted-text)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            {st || 'All Statuses'}
          </button>
        ))}
      </div>

      {/* Ledger Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--surface-raised)] animate-pulse" />
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
          <h2 className="text-base font-bold text-[var(--text)]">No Invoices Found</h2>
          <p className="text-xs text-[var(--muted-text)] max-w-md mx-auto">
            Click &quot;Issue New Invoice&quot; to draft an itemized deliverable invoice for a client.
          </p>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {invoices.map((inv) => {
            const isPaid = inv.status === 'PAID';
            const isDraft = inv.status === 'DRAFT';
            const isCancelled = inv.status === 'CANCELLED';
            const balanceDue = (Number(inv.totalAmount) - Number(inv.amountPaid)).toFixed(2);

            return (
              <Card key={inv.id} className="p-5 hover:border-[var(--primary)]/30 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0 mt-0.5">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[var(--text)]">
                          {inv.invoiceNumber || 'UNISSUED DRAFT'}
                        </span>
                        <Badge
                          variant={
                            isPaid
                              ? 'success'
                              : isDraft
                                ? 'neutral'
                                : isCancelled
                                  ? 'danger'
                                  : 'accent'
                          }
                          size="sm"
                        >
                          {inv.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--muted-text)] mt-0.5">
                        Client: <span className="font-semibold text-[var(--text)]">{inv.client?.name || inv.clientId}</span> • Project: {inv.project?.name || inv.projectId}
                      </p>
                      <p className="text-[0.6875rem] text-[var(--muted-text)] mt-1">
                        Issued: {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : 'Draft'} • Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Financial Balances & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:justify-end shrink-0 pt-3 lg:pt-0 border-t lg:border-0 border-[var(--border)]">
                    <div className="text-left sm:text-right">
                      <span className="text-lg font-bold text-[var(--text)] block">
                        {formatMoney(inv.totalAmount, inv.currency)}
                      </span>
                      <span className="text-[0.6875rem] text-[var(--muted-text)] block">
                        Paid: {formatMoney(inv.amountPaid, inv.currency)} • Balance:{' '}
                        <span className={Number(balanceDue) > 0 ? 'text-amber-500 font-semibold' : 'text-green-500 font-semibold'}>
                          {formatMoney(balanceDue, inv.currency)}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                        onClick={() => handlePreviewPdf(inv)}
                      >
                        PDF
                      </Button>

                      {isDraft && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Send className="w-3.5 h-3.5" />}
                          onClick={() => handleIssueInvoice(inv)}
                        >
                          Issue
                        </Button>
                      )}

                      {!isDraft && !isPaid && !isCancelled && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenPayment(inv)}
                        >
                          Settle
                        </Button>
                      )}

                      {!isPaid && !isCancelled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-500"
                          leftIcon={<Ban className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenCancel(inv)}
                        >
                          Void
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createDraft}
      />

      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoice={activeInvoice}
        onSubmit={recordPayment}
      />

      <CancelInvoiceModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        invoice={activeInvoice}
        onSubmit={cancel}
      />
    </div>
  );
};

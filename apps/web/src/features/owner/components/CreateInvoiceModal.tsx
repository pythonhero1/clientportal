import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button.js';
import type { CreateInvoicePayload } from '../../../services/invoices-api.js';
import { PlusCircle, Trash2, X, Calculator, AlertCircle } from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateInvoicePayload) => Promise<any>;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [taxRate, setTaxRate] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Live calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const taxAmount = (subtotal * (Number(taxRate) || 0)) / 100;
  const totalAmount = subtotal + taxAmount;

  const currencySymbol = currency === 'NGN' ? '₦' : '$';
  const formatMoney = (val: number) =>
    `${currencySymbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((i) => !i.description.trim() || Number(i.unitPrice) <= 0)) {
      setError('Each line item must have a valid description and a positive unit price.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        projectId: projectId.trim(),
        clientId: clientId.trim(),
        currency,
        dueDate: new Date(dueDate).toISOString(),
        taxRate: Number(taxRate) || 0,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          description: i.description.trim(),
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0,
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create draft invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">Issue New Itemized Invoice</h2>
              <p className="text-xs text-[var(--muted-text)]">Create draft invoice with decimal-safe calculations</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Project ID *</label>
              <input
                type="text"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Client User ID *</label>
              <input
                type="text"
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-medium text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="USD">USD ($)</option>
                <option value="NGN">NGN (₦)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[var(--muted-text)] uppercase tracking-wider">
                Line Items
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              >
                Add Row
              </Button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex flex-col sm:flex-row items-center gap-2.5"
                >
                  <input
                    type="text"
                    required
                    placeholder="Deliverable Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="flex-1 w-full px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-right text-[var(--text)] focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-right text-[var(--text)] focus:outline-none"
                    />
                    <span className="w-20 text-xs font-bold text-[var(--text)] text-right">
                      {formatMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-red-400 hover:text-red-500 rounded-md"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">Internal Notes / Memo</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {/* Live Totals Box */}
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-[var(--muted-text)]">
              <span>Subtotal:</span>
              <span className="font-semibold text-[var(--text)]">{formatMoney(subtotal)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-[var(--muted-text)]">
                <span>Tax ({taxRate}%):</span>
                <span className="font-semibold text-[var(--text)]">{formatMoney(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-[var(--primary)] pt-1.5 border-t border-[var(--border)]">
              <span>Total Invoice Amount:</span>
              <span>{formatMoney(totalAmount)}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating Draft...' : 'Create Draft Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { createTicket, type TicketItem } from '../../../services/support-api';
import { X, PlusCircle, CheckCircle2 } from 'lucide-react';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (ticket: TicketItem) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated,
}) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const ticket = await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });

      setIsSuccess(true);
      onTicketCreated(ticket);

      setTimeout(() => {
        setIsSuccess(false);
        setSubject('');
        setDescription('');
        setPriority('NORMAL');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-lg font-bold text-[var(--text)]">Open Support Ticket</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[var(--success-text)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--text)]">Ticket Submitted Successfully</h3>
            {/* STRICT SLA AUDIT: Compliant copy with NO invented response time promise */}
            <p className="text-xs text-[var(--muted-text)] max-w-sm mx-auto leading-relaxed">
              Your ticket has been submitted. Stephen has been notified and will review your request.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-xs text-[var(--danger)]">
                {error}
              </div>
            )}

            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-medium text-[var(--text)] mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              >
                <option value="LOW">Low (General inquiry)</option>
                <option value="NORMAL">Normal (Standard assistance)</option>
                <option value="HIGH">High (Impacts ongoing milestone)</option>
                <option value="URGENT">Urgent (Critical blocker)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text)] mb-1">
                Description & Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your inquiry, affected files, or assistance needed..."
                rows={4}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              />
            </div>

            {/* Note compliance: No false turnaround guarantee */}
            <p className="text-[0.6875rem] text-[var(--muted-text)] leading-relaxed">
              Support requests are managed directly by Stephen. You will receive an in-app and push notification when a reply is posted.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                disabled={!subject.trim() || !description.trim()}
              >
                Submit Ticket
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

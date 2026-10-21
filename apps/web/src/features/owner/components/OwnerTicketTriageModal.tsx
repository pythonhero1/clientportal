import React, { useState, useEffect } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { TicketItem } from '../../../services/support-api';
import {
  fetchTicketDetails,
  sendOwnerReply,
  triageTicket,
} from '../../../services/support-api';
import {
  X,
  Send,
  User,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface OwnerTicketTriageModalProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated?: () => void;
}

export const OwnerTicketTriageModal: React.FC<OwnerTicketTriageModalProps> = ({
  ticketId,
  isOpen,
  onClose,
  onTicketUpdated,
}) => {
  const [ticket, setTicket] = useState<TicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState<TicketItem['status']>('OPEN');
  const [priority, setPriority] = useState<TicketItem['priority']>('NORMAL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingTriage, setIsUpdatingTriage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId || !isOpen) return;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchTicketDetails(ticketId!);
        setTicket(data);
        setStatus(data.status);
        setPriority(data.priority);
      } catch (err: any) {
        setError(err.message || 'Failed to load ticket details');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [ticketId, isOpen]);

  if (!isOpen || !ticketId) return null;

  const handleTriageSave = async () => {
    if (!ticket) return;
    setIsUpdatingTriage(true);
    try {
      const updated = await triageTicket(ticket.id, { status, priority });
      setTicket((prev) => (prev ? { ...prev, status: updated.status, priority: updated.priority } : updated));
      if (onTicketUpdated) onTicketUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update ticket triage');
    } finally {
      setIsUpdatingTriage(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !ticket) return;

    setIsSending(true);
    try {
      const msg = await sendOwnerReply(ticket.id, replyText.trim());
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === 'WAITING_FOR_OWNER' ? 'WAITING_FOR_CLIENT' : prev.status,
              messages: [...(prev.messages || []), msg],
            }
          : null,
      );
      setReplyText('');
      if (onTicketUpdated) onTicketUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveAndReply = async () => {
    if (!ticket) return;
    if (replyText.trim()) {
      await handleSendReply({ preventDefault: () => {} } as any);
    }
    try {
      const updated = await triageTicket(ticket.id, { status: 'RESOLVED' });
      setTicket((prev) => (prev ? { ...prev, status: 'RESOLVED', resolvedAt: updated.resolvedAt } : null));
      setStatus('RESOLVED');
      if (onTicketUpdated) onTicketUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to mark ticket resolved');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-start justify-between gap-4 bg-[var(--surface-raised)]/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-[var(--muted-text)]">
                {ticket?.ticketNumber || '...'}
              </span>
              {ticket && (
                <>
                  <Badge
                    variant={
                      ticket.status === 'RESOLVED'
                        ? 'success'
                        : ticket.status === 'WAITING_FOR_OWNER'
                          ? 'warning'
                          : 'accent'
                    }
                    size="sm"
                  >
                    {ticket.status}
                  </Badge>
                  <Badge
                    variant={ticket.priority === 'URGENT' ? 'danger' : 'neutral'}
                    size="sm"
                  >
                    {ticket.priority}
                  </Badge>
                </>
              )}
            </div>
            <h2 className="text-xl font-bold text-[var(--text)] tracking-tight">
              {ticket?.subject || 'Loading ticket...'}
            </h2>
            <div className="flex items-center gap-4 text-xs text-[var(--muted-text)] mt-1.5 flex-wrap">
              <span>Client: <strong className="text-[var(--text)]">{ticket?.client?.name || ticket?.client?.email || 'Unknown'}</strong></span>
              {ticket?.project && (
                <span>Project: <strong className="text-[var(--text)]">{ticket.project.name}</strong></span>
              )}
              <span>Opened: {ticket ? new Date(ticket.createdAt).toLocaleString() : ''}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Triage Settings Bar */}
        <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[var(--muted-text)]">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketItem['status'])}
                className="px-2.5 py-1 text-xs rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
              >
                <option value="OPEN">Open</option>
                <option value="WAITING_FOR_OWNER">Waiting for Owner</option>
                <option value="WAITING_FOR_CLIENT">Waiting for Client</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[var(--muted-text)]">Priority:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketItem['priority'])}
                className="px-2.5 py-1 text-xs rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={isUpdatingTriage || (status === ticket?.status && priority === ticket?.priority)}
              onClick={handleTriageSave}
            >
              {isUpdatingTriage ? 'Updating...' : 'Save Triage'}
            </Button>
          </div>

          {ticket?.status !== 'RESOLVED' && ticket?.status !== 'CLOSED' && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              onClick={handleResolveAndReply}
            >
              Resolve Ticket
            </Button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="m-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-[var(--muted-text)]">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading messages...</span>
            </div>
          ) : ticket?.messages && ticket.messages.length > 0 ? (
            ticket.messages.map((msg) => {
              const isOwner = msg.author.role === 'Owner';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-1">
                      {isOwner ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
                          Stephen Oderinde (You)
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5 text-[var(--muted-text)]" />
                          {msg.author.name || msg.author.email}
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--muted-text)]">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isOwner
                        ? 'bg-[var(--primary)] text-white rounded-tr-xs'
                        : 'bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] rounded-tl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-[var(--muted-text)]">
              No messages found on this ticket.
            </div>
          )}
        </div>

        {/* Reply Composer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/40">
          <form onSubmit={handleSendReply} className="flex gap-2">
            <textarea
              rows={2}
              placeholder="Write Stephen's response to client..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={isSending}
              className="flex-1 p-2.5 rounded-xl text-sm bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isSending || !replyText.trim()}
              className="self-end"
              leftIcon={
                isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )
              }
            >
              Reply
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

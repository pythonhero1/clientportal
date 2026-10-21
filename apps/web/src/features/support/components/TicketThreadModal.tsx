import React, { useState, useEffect } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  type TicketItem,
  fetchTicketDetails,
  sendTicketMessage,
  updateTicketStatus,
} from '../../../services/support-api';
import { X, Send, CheckCircle2, User, ShieldCheck, Loader2 } from 'lucide-react';

interface TicketThreadModalProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated?: () => void;
}

export const TicketThreadModal: React.FC<TicketThreadModalProps> = ({
  ticketId,
  isOpen,
  onClose,
  onTicketUpdated,
}) => {
  const [ticket, setTicket] = useState<TicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId || !isOpen) return;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchTicketDetails(ticketId!);
        setTicket(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load ticket details');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [ticketId, isOpen]);

  if (!isOpen || !ticketId) return null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !ticket) return;

    setIsSending(true);
    try {
      const msg = await sendTicketMessage(ticket.id, replyText.trim());
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: 'WAITING_FOR_OWNER',
              messages: [...(prev.messages || []), msg],
            }
          : prev,
      );
      setReplyText('');
      if (onTicketUpdated) onTicketUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async () => {
    if (!ticket) return;
    try {
      await updateTicketStatus(ticket.id, 'RESOLVED');
      setTicket((prev) => (prev ? { ...prev, status: 'RESOLVED' } : prev));
      if (onTicketUpdated) onTicketUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve ticket');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <Badge variant="success" size="sm">RESOLVED</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral" size="sm">CLOSED</Badge>;
      case 'WAITING_FOR_CLIENT':
        return <Badge variant="accent" size="sm">WAITING FOR YOUR REPLY</Badge>;
      case 'WAITING_FOR_OWNER':
        return <Badge variant="warning" size="sm">WAITING FOR STEPHEN</Badge>;
      default:
        return <Badge variant="warning" size="sm">OPEN</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--primary)]">
                {ticket?.ticketNumber || 'Ticket Thread'}
              </span>
              {ticket && getStatusBadge(ticket.status)}
              {ticket?.priority && (
                <span className="text-[0.6875rem] font-semibold text-[var(--muted-text)] uppercase">
                  {ticket.priority} PRIORITY
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text)] mt-1 truncate max-w-md sm:max-w-xl">
              {ticket?.subject || 'Loading ticket...'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center text-[var(--muted-text)] text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading ticket conversation...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-xs text-[var(--danger)]">
              {error}
            </div>
          ) : ticket ? (
            <>
              {/* Messages Thread */}
              <div className="space-y-3">
                {ticket.messages?.map((msg) => {
                  const isOwner = msg.author?.role === 'Owner';
                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl border ${
                        isOwner
                          ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5 ml-4 sm:ml-8'
                          : 'border-[var(--border)] bg-[var(--surface-raised)] mr-4 sm:mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                              isOwner
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-[var(--border)] text-[var(--text)]'
                            }`}
                          >
                            {isOwner ? (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-[var(--text)]">
                            {isOwner ? 'Stephen Oderinde (Owner)' : msg.author?.name || 'You'}
                          </span>
                        </div>
                        <span className="text-[0.6875rem] text-[var(--muted-text)]">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text)] leading-relaxed whitespace-pre-wrap pl-8">
                        {msg.content}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Resolution Action */}
              {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResolve}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[var(--success-text)]" />}
                    className="text-xs"
                  >
                    Mark Ticket as Resolved
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Reply Footer */}
        {ticket && ticket.status !== 'CLOSED' && (
          <form
            onSubmit={handleSendReply}
            className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--surface)] flex items-end gap-2 shrink-0"
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response to Stephen..."
              rows={2}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] resize-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSending}
              disabled={!replyText.trim()}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="shrink-0 h-10 px-4"
            >
              Reply
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import type { MessageDto } from '../../../services/messages-api';
import { MessageItem } from './MessageItem';
import { getActivePersona } from '../../../services/projects-api';
import { MessageSquare } from 'lucide-react';

interface MessageThreadProps {
  messages: MessageDto[];
  isLoading: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  isLoading,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const persona = getActivePersona();

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-[var(--muted-text)]">
        Loading conversation history...
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center mb-3 text-[var(--muted-text)]">
          <MessageSquare className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-[var(--text)]">No messages yet</p>
        <p className="text-xs text-[var(--muted-text)] max-w-xs mt-1">
          Send a message below to start communicating with Stephen on your project deliverables.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 p-4 overflow-y-auto space-y-4"
      role="log"
      aria-live="polite"
      aria-label="Message History"
    >
      {messages.map((msg) => {
        const isOwn =
          msg.senderId === persona.id ||
          msg.sender?.email === persona.email ||
          msg.sender?.role === persona.role;

        return <MessageItem key={msg.id} message={msg} isOwn={isOwn} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
};

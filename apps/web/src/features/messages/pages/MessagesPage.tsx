import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { Send, Paperclip } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <FixtureBadge phase="P05" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Messages & Communication
          </h1>
          <p className="text-xs text-[var(--muted-text)] mt-0.5">
            Real-time persistent messaging with Stephen on project deliverables.
          </p>
        </div>
        <Badge variant="success" size="sm" dot>Connected</Badge>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Messages Header */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white font-semibold text-xs flex items-center justify-center">
              SO
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Stephen Oderinde</p>
              <p className="text-[0.6875rem] text-[var(--muted-text)]">Project Lead & Architect</p>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="flex flex-col items-start max-w-md">
            <div className="p-3 rounded-2xl rounded-tl-xs bg-[var(--surface-raised)] border border-[var(--border)] text-sm text-[var(--text)]">
              Welcome to the client portal! I have uploaded the updated v2.1 wireframes to the Files section for your review.
            </div>
            <span className="text-[0.625rem] text-[var(--muted-text)] mt-1 px-1">Oct 18, 2026, 2:15 PM</span>
          </div>

          <div className="flex flex-col items-end max-w-md ml-auto">
            <div className="p-3 rounded-2xl rounded-tr-xs bg-[var(--primary)] text-white text-sm">
              Thanks Stephen! Reviewing the desktop and tablet compositions now.
            </div>
            <span className="text-[0.625rem] text-[var(--muted-text)] mt-1 px-1">Oct 18, 2026, 2:30 PM</span>
          </div>
        </div>

        {/* Compose Input Bar */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] flex items-center gap-2">
          <button
            className="p-2 text-[var(--muted-text)] hover:text-[var(--text)] rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Type a message to Stephen..."
            className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] text-sm px-3.5 py-2 rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          />
          <Button variant="primary" size="sm" rightIcon={<Send className="w-4 h-4" />}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
};

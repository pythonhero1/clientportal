import React, { useState } from 'react';
import type { ConversationDto } from '../../../services/messages-api';
import { Badge } from '../../../components/ui/Badge';
import { MessageSquare, Users, FolderGit2, Search } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface ConversationListProps {
  conversations: ConversationDto[];
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = conversations.filter((c) => {
    const title = c.title || c.project?.name || 'Direct Conversation';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PROJECT':
        return <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />;
      case 'GROUP':
        return <Users className="w-4 h-4 text-[var(--accent-cyan)]" />;
      default:
        return <MessageSquare className="w-4 h-4 text-[var(--muted-text)]" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PROJECT':
        return <Badge variant="neutral" size="sm">Project</Badge>;
      case 'GROUP':
        return <Badge variant="accent" size="sm">Group</Badge>;
      case 'GENERAL':
        return <Badge variant="neutral" size="sm">General</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Direct</Badge>;
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)]', className)}>
      {/* Search Bar */}
      <div className="p-3 border-b border-[var(--border)]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-text)]" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--muted-text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          />
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]/40" role="listbox" aria-label="Conversations">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--muted-text)]">
            No conversations found
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === activeId;
            const displayName =
              conv.title ||
              (conv.project ? conv.project.name : 'Stephen & Team');
            const lastMsg = conv.messages?.[0]?.content || 'No messages yet';

            return (
              <button
                key={conv.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'w-full text-left p-3.5 transition-colors flex items-start gap-3 select-none cursor-pointer',
                  isSelected
                    ? 'bg-[var(--surface-raised)] border-l-3 border-[var(--primary)]'
                    : 'hover:bg-[var(--surface-raised)]/60 border-l-3 border-transparent',
                )}
              >
                <div className="w-8 h-8 rounded-full bg-[var(--inset-surface)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                  {getTypeIcon(conv.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-semibold text-xs text-[var(--text)] truncate">
                      {displayName}
                    </span>
                    {getTypeBadge(conv.type)}
                  </div>
                  <p className="text-[0.6875rem] text-[var(--muted-text)] truncate mt-1">
                    {lastMsg}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

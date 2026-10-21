import React from 'react';
import type { MessageDto } from '../../../services/messages-api';
import { Badge } from '../../../components/ui/Badge';
import { FileText } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface MessageItemProps {
  message: MessageDto;
  isOwn: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const senderInitial = message.sender.name
    ? message.sender.name.substring(0, 2).toUpperCase()
    : message.sender.role === 'Owner'
      ? 'SO'
      : 'CL';

  return (
    <div
      className={cn(
        'flex gap-2.5 max-w-xl group',
        isOwn ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-full text-[0.6875rem] font-bold flex items-center justify-center shrink-0 mt-1',
          message.sender.role === 'Owner'
            ? 'bg-[var(--primary)] text-white'
            : 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)]',
        )}
      >
        {senderInitial}
      </div>

      {/* Bubble + Metadata */}
      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-[0.6875rem] font-medium text-[var(--text)]">
            {message.sender.name || (message.sender.role === 'Owner' ? 'Stephen Oderinde' : 'Client')}
          </span>
          <Badge
            variant={message.sender.role === 'Owner' ? 'accent' : 'neutral'}
            size="sm"
          >
            {message.sender.role}
          </Badge>
        </div>

        <div
          className={cn(
            'p-3.5 rounded-2xl text-xs leading-relaxed max-w-md shadow-xs break-words',
            isOwn
              ? 'bg-[var(--primary)] text-white rounded-tr-xs'
              : 'bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] rounded-tl-xs',
          )}
        >
          {message.content}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-white/20 space-y-1.5">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className={cn(
                    'flex items-center gap-2 p-1.5 rounded-lg text-[0.6875rem]',
                    isOwn
                      ? 'bg-black/15 text-white'
                      : 'bg-[var(--inset-surface)] border border-[var(--border)] text-[var(--text)]',
                  )}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-medium flex-1">
                    {att.fileVersion.fileName}
                  </span>
                  <span className="text-[0.625rem] opacity-75 shrink-0">
                    {Math.round(Number(att.fileVersion.byteSize) / 1024)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <span className="text-[0.625rem] text-[var(--muted-text)] mt-1 px-1">
          {formattedTime}
        </span>
      </div>
    </div>
  );
};

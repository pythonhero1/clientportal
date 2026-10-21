import React, { useState, type KeyboardEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Paperclip, Send, X, FileText } from 'lucide-react';
import type { FileVersionDto } from '../../../services/files-api';
import { AttachmentPickerModal } from './AttachmentPickerModal';

interface MessageComposerProps {
  onSend: (content: string, fileVersionIds?: string[]) => Promise<any>;
  isSending: boolean;
  isConnected: boolean;
  projectId?: string | null;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  isSending,
  isConnected,
  projectId,
}) => {
  const [content, setContent] = useState('');
  const [attachedVersions, setAttachedVersions] = useState<FileVersionDto[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleSend = async () => {
    if (!content.trim() && attachedVersions.length === 0) return;
    if (isSending) return;

    const fileVersionIds = attachedVersions.map((v) => v.id);
    const textToSend = content.trim();

    try {
      setContent('');
      setAttachedVersions([]);
      await onSend(textToSend, fileVersionIds);
    } catch {
      // If error occurs, restore unsent message
      setContent(textToSend);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttach = (version: FileVersionDto) => {
    if (!attachedVersions.some((v) => v.id === version.id)) {
      setAttachedVersions((prev) => [...prev, version]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachedVersions((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] flex flex-col gap-2">
      {/* Attached Files Bar */}
      {attachedVersions.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachedVersions.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[0.6875rem] text-[var(--text)]"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span className="truncate max-w-[140px] font-medium">{v.fileName}</span>
              <button
                type="button"
                onClick={() => removeAttachment(v.id)}
                className="p-0.5 hover:text-[var(--danger-text)] text-[var(--muted-text)] transition-colors"
                aria-label="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className="p-2 text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] cursor-pointer"
          aria-label="Attach project file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <textarea
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'Type a message... (Press Enter to send)' : 'Connecting to chat...'}
          className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] text-xs px-3.5 py-2.5 rounded-xl resize-none focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] placeholder-[var(--muted-text)] leading-normal max-h-24"
        />

        <Button
          variant="primary"
          size="sm"
          disabled={(!content.trim() && attachedVersions.length === 0) || isSending}
          isLoading={isSending}
          onClick={handleSend}
          rightIcon={<Send className="w-3.5 h-3.5" />}
        >
          Send
        </Button>
      </div>

      <AttachmentPickerModal
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        projectId={projectId}
        onSelect={handleAttach}
      />
    </div>
  );
};

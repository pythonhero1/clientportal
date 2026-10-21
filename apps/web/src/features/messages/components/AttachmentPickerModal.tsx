import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { filesApi, type FileItemDto, type FileVersionDto } from '../../../services/files-api';
import { FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface AttachmentPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
  onSelect: (fileVersion: FileVersionDto) => void;
}

export const AttachmentPickerModal: React.FC<AttachmentPickerModalProps> = ({
  open,
  onOpenChange,
  projectId = 'proj_1',
  onSelect,
}) => {
  const [files, setFiles] = useState<FileItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      filesApi
        .listFiles(projectId || 'proj_1')
        .then((data) => {
          // Only show active files with clean latest versions
          const available = data.filter(
            (f) =>
              f.lifecycleStatus === 'ACTIVE' &&
              f.latestVersion &&
              f.latestVersion.scanStatus === 'CLEAN',
          );
          setFiles(available);
        })
        .catch(() => setFiles([]))
        .finally(() => setIsLoading(false));
    }
  }, [open, projectId]);

  const handleConfirm = () => {
    const file = files.find((f) => f.latestVersion?.id === selectedId);
    if (file && file.latestVersion) {
      onSelect(file.latestVersion);
      onOpenChange(false);
      setSelectedId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Attach Project Deliverable"
      description="Select an approved deliverable file version to attach to your message."
    >
      <div className="space-y-4 my-2">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--muted-text)]">
            Loading deliverables...
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted-text)]">
            No clean project deliverables found to attach.
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1" role="listbox">
            {files.map((file) => {
              const version = file.latestVersion!;
              const isSelected = selectedId === version.id;

              return (
                <div
                  key={version.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setSelectedId(version.id)}
                  className={cn(
                    'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none',
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--surface-raised)] shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--inset-surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text)] truncate">
                        {file.name}
                      </p>
                      <p className="text-[0.625rem] text-[var(--muted-text)] truncate">
                        {version.fileName} • {Math.round(Number(version.byteSize) / 1024)} KB
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedId}
            onClick={handleConfirm}
          >
            Attach File
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

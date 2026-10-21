import React, { useState } from 'react';
import { useFileLifecycle } from '../hooks/useFileLifecycle';
import { FileUploadModal } from '../../files/components/FileUploadModal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  UploadCloud,
  Archive,
  Trash2,
  RotateCcw,
  AlertTriangle,
  FolderOpen,
  RefreshCw,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const OwnerFilesPage: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isLoading,
    actionLoading,
    error,
    activeFiles,
    archivedFiles,
    softDeletedFiles,
    restrictedFiles,
    refetch,
    archive,
    unarchive,
    softDelete,
    restore,
    permanentDelete,
  } = useFileLifecycle();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [deleteModalFile, setDeleteModalFile] = useState<any | null>(null);
  const [confirmationInput, setConfirmationInput] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  const currentList =
    activeTab === 'ACTIVE'
      ? activeFiles
      : activeTab === 'ARCHIVED'
      ? archivedFiles
      : activeTab === 'SOFT_DELETED'
      ? softDeletedFiles
      : restrictedFiles;

  const handlePermanentDelete = async () => {
    if (!deleteModalFile) return;
    if (confirmationInput.trim().toLowerCase() !== deleteModalFile.name.trim().toLowerCase()) {
      setModalError(`Please type the exact file title "${deleteModalFile.name}" to confirm.`);
      return;
    }
    try {
      setModalError(null);
      await permanentDelete(deleteModalFile.id, confirmationInput.trim());
      setDeleteModalFile(null);
      setConfirmationInput('');
    } catch (err: any) {
      setModalError(err.message || 'Permanent deletion failed');
    }
  };

  const calculateDaysRemaining = (expiresAtStr?: string | null) => {
    if (!expiresAtStr) return 0;
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
              Deliverables & Lifecycle Management
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[var(--primary)] text-white">
              Owner Surface
            </span>
          </div>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Upload deliverable versions (up to 500 MB), manage client visibility, and operate 90-day recovery policies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            Upload Deliverable
          </Button>
        </div>
      </div>

      {/* Lifecycle Policy Notice */}
      <Card className="border border-[var(--border)] bg-[var(--surface-raised)]/60 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-[var(--text)]">Authoritative Retention & Deletion Rules (D-8)</h4>
            <p className="text-[var(--muted-text)]">
              Archived files are preserved indefinitely without automatic purge. Soft-deleted files maintain a strict 90-day recovery window. Once expired, files enter restricted post-window state pending explicit Owner authorization for permanent destruction. All deletion/restoration alerts route exclusively to the Owner.
            </p>
          </div>
        </div>
      </Card>

      {/* Lifecycle Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        {[
          { key: 'ACTIVE', label: `Active (${activeFiles.length})` },
          { key: 'ARCHIVED', label: `Archived (${archivedFiles.length})` },
          { key: 'SOFT_DELETED', label: `Soft-Deleted (${softDeletedFiles.length})` },
          { key: 'RESTRICTED', label: `Restricted Post-Window (${restrictedFiles.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === tab.key
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-[var(--surface)] text-[var(--muted-text)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3.5 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)]">
          {error}
        </div>
      )}

      {/* File List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-xl bg-[var(--surface-raised)] animate-pulse border border-[var(--border)]" />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <Card className="p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <FolderOpen className="w-10 h-10 mx-auto text-[var(--muted-text)] mb-2" />
          <h4 className="text-sm font-bold text-[var(--text)]">No Files in {activeTab.replace('_', ' ')}</h4>
          <p className="text-xs text-[var(--muted-text)] mt-1">
            {activeTab === 'ACTIVE'
              ? 'No active files uploaded yet.'
              : `No files are currently in ${activeTab.toLowerCase().replace('_', ' ')} state.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {currentList.map((file) => {
            const daysLeft = calculateDaysRemaining(file.softDeleteExpiresAt);
            return (
              <Card
                key={file.id}
                className="p-4 border border-[var(--border)] bg-[var(--surface)] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[var(--text)]">{file.name}</h4>
                      <Badge variant="neutral" size="sm">
                        {file.category.replace('_', ' ')}
                      </Badge>
                      {file.visibility === 'INTERNAL' && (
                        <Badge variant="neutral" size="sm">
                          Internal
                        </Badge>
                      )}
                      <Badge variant="accent" size="sm">
                        v{file.currentVersionNumber}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-2xs text-[var(--muted-text)] mt-1">
                      <span>Updated: {new Date(file.updatedAt).toLocaleDateString()}</span>
                      {file.lifecycleStatus === 'SOFT_DELETED' && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-[var(--warning-text)] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {daysLeft} days remaining in 90-day recovery window
                          </span>
                        </>
                      )}
                      {file.lifecycleStatus === 'RESTRICTED_POST_WINDOW' && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-[var(--danger-text)]">
                            90-day recovery expired • Restricted pending permanent purge
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lifecycle Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {file.lifecycleStatus === 'ACTIVE' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => archive(file.id)}
                        leftIcon={<Archive className="w-3.5 h-3.5" />}
                      >
                        Archive
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => softDelete(file.id)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-[var(--danger-text)]" />}
                      >
                        Soft Delete
                      </Button>
                    </>
                  )}

                  {file.lifecycleStatus === 'ARCHIVED' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => unarchive(file.id)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Unarchive
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => softDelete(file.id)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-[var(--danger-text)]" />}
                      >
                        Soft Delete
                      </Button>
                    </>
                  )}

                  {file.lifecycleStatus === 'SOFT_DELETED' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => restore(file.id)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Restore File
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => setDeleteModalFile(file)}
                        className="text-[var(--danger-text)] border-[var(--danger-border)] hover:bg-[var(--danger-bg)]"
                      >
                        Permanent Purge
                      </Button>
                    </>
                  )}

                  {file.lifecycleStatus === 'RESTRICTED_POST_WINDOW' && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => setDeleteModalFile(file)}
                      className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
                      leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                    >
                      Authorize Permanent Purge
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Deliverable Modal */}
      <FileUploadModal
        projectId="proj_1"
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => refetch()}
        isOwner={true}
      />

      {/* High-Friction Permanent Deletion Modal */}
      {deleteModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-[var(--surface)] border border-[var(--danger-border)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[var(--danger-text)]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[var(--text)]">Authorize Permanent Deletion</h3>
            </div>

            <p className="text-xs text-[var(--muted-text)] leading-relaxed">
              This action is <strong className="text-[var(--danger-text)]">permanent and irreversible</strong>. All S3 version objects, metadata, and historical feedback will be completely purged from private storage.
            </p>

            <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs">
              <span className="text-[var(--muted-text)]">Target Deliverable:</span>{' '}
              <strong className="text-[var(--text)]">{deleteModalFile.name}</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Type <span className="text-[var(--danger-text)] font-mono">{deleteModalFile.name}</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={deleteModalFile.name}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--danger)]"
              />
            </div>

            {modalError && (
              <p className="text-xs text-[var(--danger-text)] font-semibold">{modalError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteModalFile(null);
                  setConfirmationInput('');
                  setModalError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading || confirmationInput.trim() !== deleteModalFile.name.trim()}
                onClick={handlePermanentDelete}
                className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
              >
                {actionLoading ? 'Purging S3 Storage...' : 'Permanently Purge Deliverable'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

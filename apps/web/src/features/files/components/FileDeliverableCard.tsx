import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { FileItemDto, FileVersionDto } from '../../../services/files-api';
import { useFileVersion } from '../hooks/useFileVersion';
import {
  FileText,
  Download,
  CheckCircle,
  MessageSquare,
  Clock,
  Send,
  Upload,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface FileDeliverableCardProps {
  projectId: string;
  file: FileItemDto;
  isDesignatedApprover?: boolean;
  isOwner?: boolean;
  onUploadNewVersion?: (file: FileItemDto) => void;
  onRefresh?: () => void;
}

export const FileDeliverableCard: React.FC<FileDeliverableCardProps> = ({
  projectId,
  file,
  isDesignatedApprover = false,
  isOwner = false,
  onUploadNewVersion,
  onRefresh,
}) => {
  const versions = file.versions || (file.latestVersion ? [file.latestVersion] : []);
  const latestVersion = file.latestVersion || versions[0];

  const [activeVersionNumber, setActiveVersionNumber] = useState<number>(
    latestVersion?.versionNumber || 1,
  );
  const [showFeedback, setShowFeedback] = useState<boolean>(true);
  const [commentInput, setCommentInput] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [showApprovalInput, setShowApprovalInput] = useState<boolean>(false);

  const currentVersion: FileVersionDto | undefined =
    versions.find((v) => v.versionNumber === activeVersionNumber) || latestVersion;

  const {
    comments,
    isSubmittingComment,
    isApproving,
    isDownloading,
    actionError,
    postComment,
    approveVersion,
    downloadVersion,
  } = useFileVersion(projectId, file.id, currentVersion);

  const canApprove = isOwner || isDesignatedApprover;
  const isApproved = currentVersion?.reviewStatus === 'APPROVED';

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    try {
      await postComment(commentInput.trim());
      setCommentInput('');
      onRefresh?.();
    } catch {
      // Handled by hook
    }
  };

  const handleApprove = async () => {
    try {
      await approveVersion(approvalNotes);
      setShowApprovalInput(false);
      setApprovalNotes('');
      onRefresh?.();
    } catch {
      // Handled by hook
    }
  };

  const formatSize = (bytes: number | string | undefined) => {
    if (!bytes) return '0 KB';
    const num = Number(bytes);
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="p-5 space-y-4 border border-[var(--border)] bg-[var(--surface)] shadow-xs">
      {/* Top Header: Deliverable Name, Category, Version Badges */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[var(--text)] tracking-tight">
                {file.name}
              </h3>
              <Badge variant="neutral" size="sm">
                {file.category.replace('_', ' ')}
              </Badge>
              {file.visibility === 'INTERNAL' && (
                <Badge variant="neutral" size="sm">
                  Internal Staff Only
                </Badge>
              )}
            </div>

            <p className="text-xs text-[var(--muted-text)] mt-1 flex flex-wrap items-center gap-2">
              <span>Original file: {currentVersion?.fileName || 'deliverable'}</span>
              <span>•</span>
              <span>{formatSize(currentVersion?.byteSize)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {currentVersion?.createdAt
                  ? new Date(currentVersion.createdAt).toLocaleDateString()
                  : 'Recent'}
              </span>
            </p>
          </div>
        </div>

        {/* Version Switcher and Download Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Version Switcher */}
          {versions.length > 1 && (
            <div className="relative inline-flex items-center">
              <select
                value={activeVersionNumber}
                onChange={(e) => setActiveVersionNumber(Number(e.target.value))}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)] pr-7 appearance-none cursor-pointer"
                aria-label="Select file version"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.versionNumber}>
                    Version {v.versionNumber} {v.isLatest ? '(Latest)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-text)] absolute right-2 pointer-events-none" />
            </div>
          )}

          {/* Download Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadVersion}
            disabled={isDownloading}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {isDownloading ? 'Issuing Link...' : 'Download File'}
          </Button>

          {/* Upload New Version (if Owner or allowed) */}
          {isOwner && onUploadNewVersion && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUploadNewVersion(file)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              New Version
            </Button>
          )}
        </div>
      </div>

      {/* Review Status & Designated Approver Banner */}
      <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isApproved ? (
            <CheckCircle className="w-5 h-5 text-[var(--success-text)] shrink-0" />
          ) : (
            <Clock className="w-5 h-5 text-[var(--warning-text)] shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text)]">
                Version {currentVersion?.versionNumber} Review Status:
              </span>
              <Badge
                variant={isApproved ? 'success' : 'warning'}
                size="sm"
                dot
              >
                {isApproved ? 'Approved Deliverable' : 'Pending Client Review'}
              </Badge>
            </div>
            {isApproved && currentVersion?.approvedAt && (
              <p className="text-2xs text-[var(--muted-text)] mt-0.5">
                Approved on {new Date(currentVersion.approvedAt).toLocaleDateString()}
                {currentVersion.approvalNotes ? ` • "${currentVersion.approvalNotes}"` : ''}
              </p>
            )}
            {!isApproved && !canApprove && (
              <p className="text-2xs text-[var(--muted-text)] mt-0.5">
                Deliverable sign-off requires designated approver authorization.
              </p>
            )}
          </div>
        </div>

        {/* Approver Action Button */}
        {!isApproved && canApprove && (
          <div className="flex items-center gap-2 shrink-0">
            {showApprovalInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Approval notes (optional)"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-hidden"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApprove}
                  disabled={isApproving}
                  leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                >
                  Confirm Sign-Off
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApprovalInput(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowApprovalInput(true)}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Approve Version {currentVersion?.versionNumber}
              </Button>
            )}
          </div>
        )}
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Version-Specific Feedback & Comments Section */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => setShowFeedback(!showFeedback)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Version {currentVersion?.versionNumber} Feedback & Discussion ({comments.length})</span>
        </button>

        {showFeedback && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Comment Thread */}
            {comments.length === 0 ? (
              <p className="text-xs text-[var(--muted-text)] italic py-1">
                No feedback recorded for Version {currentVersion?.versionNumber}. Leave targeted comments below.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
                        <span>{c.author?.name || c.author?.email || 'User'}</span>
                        <Badge
                          variant={c.author?.role === 'Owner' ? 'accent' : 'neutral'}
                          size="sm"
                        >
                          {c.author?.role}
                        </Badge>
                      </div>
                      <span className="text-2xs text-[var(--muted-text)]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[var(--text)] leading-relaxed mt-1">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Submission Form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder={`Leave feedback on Version ${currentVersion?.versionNumber}...`}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                disabled={isSubmittingComment}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] placeholder-[var(--muted-text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)]"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!commentInput.trim() || isSubmittingComment}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                {isSubmittingComment ? 'Sending...' : 'Post'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </Card>
  );
};

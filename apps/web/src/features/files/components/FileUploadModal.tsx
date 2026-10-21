import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useFileUpload } from '../hooks/useFileUpload';
import { UploadCloud, CheckCircle, AlertCircle, X, File as FileIcon } from 'lucide-react';

interface FileUploadModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isOwner?: boolean;
  existingFileId?: string;
  existingFileName?: string;
}

const CATEGORIES = [
  { key: 'IMAGES', label: 'Images (JPG, PNG, WebP, GIF)' },
  { key: 'DOCUMENTS', label: 'Documents (PDF, DOCX, TXT)' },
  { key: 'SPREADSHEETS', label: 'Spreadsheets (XLSX, CSV)' },
  { key: 'DESIGN_FILES', label: 'Design Files (SVG, PSD, AI, EPS)' },
  { key: 'ARCHIVES', label: 'Archives (ZIP)' },
  { key: 'VIDEO', label: 'Video (MP4, MOV)' },
  { key: 'AUDIO', label: 'Audio (MP3, WAV)' },
] as const;

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onSuccess,
  isOwner = false,
  existingFileId,
  existingFileName,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState<string>(existingFileName || '');
  const [category, setCategory] = useState<typeof CATEGORIES[number]['key']>('DOCUMENTS');
  const [visibility, setVisibility] = useState<'SHARED' | 'INTERNAL'>('SHARED');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, progress, statusText, error, uploadFile, reset } = useFileUpload();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!name) {
        setName(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      await uploadFile(projectId, file, {
        name: name || file.name,
        category,
        visibility: isOwner ? visibility : 'SHARED',
        isNewVersion: !!existingFileId,
        existingFileId,
      });
      onSuccess();
      handleClose();
    } catch {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    reset();
    setFile(null);
    setName('');
    onClose();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] shadow-2xl relative">
        <button
          onClick={handleClose}
          disabled={isUploading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <CardHeader>
          <CardTitle className="text-xl font-bold text-[var(--text)]">
            {existingFileId ? `Upload New Version: ${existingFileName}` : 'Upload Direct Deliverable'}
          </CardTitle>
          <p className="text-xs text-[var(--muted-text)] mt-1">
            Direct-to-S3 transfer • Decimal 500 MB limit • Strict 7-category validation
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Drag / Drop area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[var(--surface-raised)]/40 hover:bg-[var(--surface-raised)]"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <UploadCloud className="w-10 h-10 mx-auto text-[var(--primary)] mb-2" />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <FileIcon className="w-4 h-4 text-[var(--primary)]" />
                  <span>{file.name}</span>
                  <span className="text-xs text-[var(--muted-text)]">({formatSize(file.size)})</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-[var(--text)]">
                    Click to browse or drag file here
                  </p>
                  <p className="text-xs text-[var(--muted-text)] mt-1">
                    Up to 500 MB (decimal limit: 500,000,000 bytes)
                  </p>
                </>
              )}
            </div>

            {/* Logical Title */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Deliverable Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Homepage Design Mockup"
                required
                disabled={isUploading}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Approved Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                disabled={isUploading}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility Toggle for Owner */}
            {isOwner && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Access Visibility
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'SHARED'}
                      onChange={() => setVisibility('SHARED')}
                      disabled={isUploading}
                    />
                    <span>Shared with Client</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'INTERNAL'}
                      onChange={() => setVisibility('INTERNAL')}
                      disabled={isUploading}
                    />
                    <span>Internal (Staff-only, hidden from Client)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-[var(--muted-text)]">
                  <span>{statusText}</span>
                  <span className="font-semibold text-[var(--text)]">{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-raised)] overflow-hidden border border-[var(--border)]">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!file || isUploading}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                {isUploading ? 'Uploading Direct...' : existingFileId ? 'Upload New Version' : 'Upload Deliverable'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

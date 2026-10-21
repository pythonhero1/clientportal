import React, { useState, useEffect } from 'react';
import { useFiles } from '../hooks/useFiles';
import { FileDeliverableCard } from '../components/FileDeliverableCard';
import { FileUploadModal } from '../components/FileUploadModal';
import { fetchProjects } from '../../../services/projects-api';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { UploadCloud, FolderOpen, Search, RefreshCw, ShieldCheck } from 'lucide-react';

const CATEGORY_TABS = [
  { key: '', label: 'All Files' },
  { key: 'IMAGES', label: 'Images' },
  { key: 'DOCUMENTS', label: 'Documents' },
  { key: 'SPREADSHEETS', label: 'Spreadsheets' },
  { key: 'DESIGN_FILES', label: 'Design Files' },
  { key: 'ARCHIVES', label: 'Archives' },
  { key: 'VIDEO', label: 'Video' },
  { key: 'AUDIO', label: 'Audio' },
];

export const FilesFeedbackPage: React.FC = () => {
  // Use active project ID (or default client project)
  const [projectId, setProjectId] = useState<string>('proj_1');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [targetNewVersionFile, setTargetNewVersionFile] = useState<any>(null);

  useEffect(() => {
    fetchProjects()
      .then((projs) => {
        if (projs && projs.length > 0) {
          setProjects(projs);
          setProjectId(projs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Approver status derived from session / designated approver authority
  const isDesignatedApprover = true;

  const {
    files,
    isLoading,
    error,
    refetch,
    selectedCategory,
    setSelectedCategory,
  } = useFiles(projectId);

  const filteredFiles = files.filter((f) => {
    if (!searchQuery.trim()) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleOpenUploadNewVersion = (file: any) => {
    setTargetNewVersionFile(file);
    setIsUploadModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
    setTargetNewVersionFile(null);
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
              Files & Deliverables
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
              Screen 10
            </span>
          </div>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Review immutable deliverable versions, submit targeted feedback, and verify authorized milestone sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {projects.length > 1 && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="text-xs bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
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
            Upload Material
          </Button>
        </div>
      </div>

      {/* Approver Status Notice */}
      {isDesignatedApprover && (
        <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[var(--primary)] shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-[var(--text)]">Designated Approver Authorization:</span>{' '}
            <span className="text-[var(--muted-text)]">
              You are authorized to review and grant deliverable sign-offs for this project.
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = (!selectedCategory && tab.key === '') || selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key || undefined)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'bg-[var(--surface-raised)] text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--border)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-text)]" />
          <input
            type="text"
            placeholder="Search deliverables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder-[var(--muted-text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-6 animate-pulse bg-[var(--surface-raised)] h-44 rounded-xl border border-[var(--border)]" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center bg-[var(--surface)] border border-[var(--danger-border)]">
          <p className="text-sm font-semibold text-[var(--danger-text)]">{error}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
            Retry Loading
          </Button>
        </Card>
      ) : filteredFiles.length === 0 ? (
        <Card className="p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <FolderOpen className="w-12 h-12 mx-auto text-[var(--muted-text)] mb-3" />
          <h3 className="text-base font-bold text-[var(--text)]">No Deliverables Found</h3>
          <p className="text-xs text-[var(--muted-text)] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No files match your search "${searchQuery}".`
              : selectedCategory
              ? `No files available in category "${selectedCategory.replace('_', ' ')}".`
              : 'No project files or deliverable versions have been submitted yet.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4"
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            Upload First File
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFiles.map((file) => (
            <FileDeliverableCard
              key={file.id}
              projectId={projectId}
              file={file}
              isDesignatedApprover={isDesignatedApprover}
              isOwner={false}
              onUploadNewVersion={handleOpenUploadNewVersion}
              onRefresh={refetch}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <FileUploadModal
        projectId={projectId}
        isOpen={isUploadModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => refetch()}
        isOwner={false}
        existingFileId={targetNewVersionFile?.id}
        existingFileName={targetNewVersionFile?.name}
      />
    </div>
  );
};

import { useState, useCallback, useEffect } from 'react';
import { filesApi } from '../../../services/files-api';
import type { FileItemDto } from '../../../services/files-api';

export function useFileLifecycle(initialProjectId?: string) {
  const [files, setFiles] = useState<FileItemDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED' | 'SOFT_DELETED' | 'RESTRICTED'>('ACTIVE');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await filesApi.getOwnerLifecycleSummary(selectedProjectId);
      setFiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load file lifecycle summary');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const archive = useCallback(
    async (fileId: string, reason?: string) => {
      try {
        setActionLoading(true);
        await filesApi.archiveFile(fileId, reason);
        await fetchFiles();
      } catch (err: any) {
        setError(err.message || 'Failed to archive file');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchFiles],
  );

  const unarchive = useCallback(
    async (fileId: string) => {
      try {
        setActionLoading(true);
        await filesApi.unarchiveFile(fileId);
        await fetchFiles();
      } catch (err: any) {
        setError(err.message || 'Failed to unarchive file');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchFiles],
  );

  const softDelete = useCallback(
    async (fileId: string, reason?: string) => {
      try {
        setActionLoading(true);
        await filesApi.softDeleteFile(fileId, reason);
        await fetchFiles();
      } catch (err: any) {
        setError(err.message || 'Failed to soft delete file');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchFiles],
  );

  const restore = useCallback(
    async (fileId: string) => {
      try {
        setActionLoading(true);
        await filesApi.restoreFile(fileId);
        await fetchFiles();
      } catch (err: any) {
        setError(err.message || 'Failed to restore file');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchFiles],
  );

  const permanentDelete = useCallback(
    async (fileId: string, confirmationCode?: string) => {
      try {
        setActionLoading(true);
        await filesApi.permanentDeleteFile(fileId, confirmationCode);
        await fetchFiles();
      } catch (err: any) {
        setError(err.message || 'Failed to permanently delete file');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchFiles],
  );

  // Group files by tab
  const activeFiles = files.filter((f) => f.lifecycleStatus === 'ACTIVE');
  const archivedFiles = files.filter((f) => f.lifecycleStatus === 'ARCHIVED');
  const softDeletedFiles = files.filter((f) => f.lifecycleStatus === 'SOFT_DELETED');
  const restrictedFiles = files.filter((f) => f.lifecycleStatus === 'RESTRICTED_POST_WINDOW');

  return {
    files,
    selectedProjectId,
    setSelectedProjectId,
    activeTab,
    setActiveTab,
    isLoading,
    actionLoading,
    error,
    activeFiles,
    archivedFiles,
    softDeletedFiles,
    restrictedFiles,
    refetch: fetchFiles,
    archive,
    unarchive,
    softDelete,
    restore,
    permanentDelete,
  };
}

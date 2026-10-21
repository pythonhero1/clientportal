import { useState, useEffect, useCallback } from 'react';
import { filesApi } from '../../../services/files-api';
import type { FileItemDto } from '../../../services/files-api';

export function useFiles(projectId: string) {
  const [files, setFiles] = useState<FileItemDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await filesApi.listFiles(projectId, selectedCategory);
      setFiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load deliverables');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, selectedCategory]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    isLoading,
    error,
    refetch: fetchFiles,
    selectedCategory,
    setSelectedCategory,
  };
}

import { useState, useCallback } from 'react';
import { filesApi } from '../../../services/files-api';
import type { FileVersionDto, FileCommentDto } from '../../../services/files-api';

export function useFileVersion(projectId: string, fileId: string, initialVersion?: FileVersionDto | null) {
  const [selectedVersion, setSelectedVersion] = useState<FileVersionDto | null>(initialVersion || null);
  const [comments, setComments] = useState<FileCommentDto[]>(initialVersion?.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const postComment = useCallback(
    async (content: string) => {
      if (!selectedVersion || !content.trim()) return;
      try {
        setIsSubmittingComment(true);
        setActionError(null);
        const newComment = await filesApi.addComment(
          projectId,
          fileId,
          selectedVersion.id,
          content,
        );
        setComments((prev) => [...prev, newComment]);
        return newComment;
      } catch (err: any) {
        setActionError(err.message || 'Failed to submit comment');
        throw err;
      } finally {
        setIsSubmittingComment(false);
      }
    },
    [projectId, fileId, selectedVersion],
  );

  const approveVersion = useCallback(
    async (notes?: string) => {
      if (!selectedVersion) return;
      try {
        setIsApproving(true);
        setActionError(null);
        const updatedVersion = await filesApi.approveVersion(
          projectId,
          fileId,
          selectedVersion.id,
          notes,
        );
        setSelectedVersion(updatedVersion);
        return updatedVersion;
      } catch (err: any) {
        setActionError(err.message || 'Failed to approve deliverable version');
        throw err;
      } finally {
        setIsApproving(false);
      }
    },
    [projectId, fileId, selectedVersion],
  );

  const downloadVersion = useCallback(async () => {
    if (!selectedVersion) return;
    try {
      setIsDownloading(true);
      setActionError(null);
      const { downloadUrl } = await filesApi.getDownloadUrl(
        projectId,
        fileId,
        selectedVersion.id,
      );
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', selectedVersion.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setActionError(err.message || 'Failed to initiate download');
    } finally {
      setIsDownloading(false);
    }
  }, [projectId, fileId, selectedVersion]);

  return {
    selectedVersion,
    setSelectedVersion,
    comments,
    setComments,
    isSubmittingComment,
    isApproving,
    isDownloading,
    actionError,
    postComment,
    approveVersion,
    downloadVersion,
  };
}

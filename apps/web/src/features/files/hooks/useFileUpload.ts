import { useState, useCallback } from 'react';
import { filesApi } from '../../../services/files-api';
import type { RequestUploadData, FileVersionDto } from '../../../services/files-api';

export const MAX_FILE_SIZE_BYTES = 500_000_000; // 500 MB decimal limit

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setStatusText('');
    setError(null);
  }, []);

  const uploadFile = useCallback(
    async (
      projectId: string,
      file: File,
      meta: {
        name: string;
        category: 'IMAGES' | 'DOCUMENTS' | 'SPREADSHEETS' | 'DESIGN_FILES' | 'ARCHIVES' | 'VIDEO' | 'AUDIO';
        visibility?: 'SHARED' | 'INTERNAL';
        isNewVersion?: boolean;
        existingFileId?: string;
      },
    ): Promise<FileVersionDto> => {
      reset();
      setIsUploading(true);

      // 1. Client-side size validation
      if (file.size <= 0) {
        const err = 'File is empty (0 bytes).';
        setError(err);
        setIsUploading(false);
        throw new Error(err);
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const err = `File exceeds maximum size of 500 MB (${MAX_FILE_SIZE_BYTES.toLocaleString()} bytes). Current size: ${file.size.toLocaleString()} bytes.`;
        setError(err);
        setIsUploading(false);
        throw new Error(err);
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || '';

      try {
        // 2. Initiate direct S3 upload
        setStatusText('Requesting authorized direct upload URL...');
        const initData: RequestUploadData = {
          name: meta.name.trim() || file.name,
          category: meta.category,
          fileName: file.name,
          fileExtension: extension,
          byteSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          visibility: meta.visibility || 'SHARED',
          isNewVersion: meta.isNewVersion,
          existingFileId: meta.existingFileId,
        };

        const initRes = await filesApi.initiateUpload(projectId, initData);

        // 3. Direct transfer to S3 with live progress
        setStatusText('Uploading directly to private storage...');
        await filesApi.uploadToS3(initRes.uploadUrl, file, (pct) => {
          setProgress(pct);
          setStatusText(`Uploading to storage (${pct}%)...`);
        });

        // 4. Complete upload and verify quarantine
        setStatusText('Verifying upload and inspecting quarantine...');
        const completeRes = await filesApi.completeUpload(projectId, {
          fileId: initRes.fileId,
          versionId: initRes.versionId,
          quarantineKey: initRes.quarantineKey,
        });

        setStatusText('Upload verified successfully!');
        setProgress(100);
        return completeRes;
      } catch (err: any) {
        const msg = err.message || 'File upload failed';
        setError(msg);
        setStatusText('Upload failed');
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [reset],
  );

  return {
    isUploading,
    progress,
    statusText,
    error,
    uploadFile,
    reset,
  };
}

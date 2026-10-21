import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilesFeedbackPage } from './FilesFeedbackPage';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import { filesApi } from '../../../services/files-api';

vi.mock('../../../services/files-api', () => ({
  filesApi: {
    listFiles: vi.fn(),
    getFileById: vi.fn(),
    initiateUpload: vi.fn(),
    uploadToS3: vi.fn(),
    completeUpload: vi.fn(),
    getDownloadUrl: vi.fn(),
    addComment: vi.fn(),
    approveVersion: vi.fn(),
  },
}));

describe('FilesFeedbackPage (Screen 10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (filesApi.listFiles as any).mockResolvedValue([
      {
        id: 'file-1',
        projectId: 'proj_1',
        name: 'Homepage Design Deliverable',
        category: 'DESIGN_FILES',
        visibility: 'SHARED',
        lifecycleStatus: 'ACTIVE',
        currentVersionNumber: 2,
        latestVersion: {
          id: 'v-2',
          fileId: 'file-1',
          versionNumber: 2,
          fileName: 'Homepage_v2.psd',
          fileExtension: 'psd',
          byteSize: 24500000,
          scanStatus: 'CLEAN',
          isLatest: true,
          reviewStatus: 'PENDING_REVIEW',
          comments: [
            {
              id: 'c-1',
              fileVersionId: 'v-2',
              authorId: 'u-1',
              author: { name: 'Stephen', email: 'stephen@example.com', role: 'Owner' },
              content: 'Updated hero section breakpoints and alignment.',
              createdAt: new Date().toISOString(),
            },
          ],
        },
        versions: [
          {
            id: 'v-2',
            fileId: 'file-1',
            versionNumber: 2,
            fileName: 'Homepage_v2.psd',
            byteSize: 24500000,
            reviewStatus: 'PENDING_REVIEW',
            isLatest: true,
            comments: [],
          },
          {
            id: 'v-1',
            fileId: 'file-1',
            versionNumber: 1,
            fileName: 'Homepage_v1.psd',
            byteSize: 22000000,
            reviewStatus: 'APPROVED',
            isLatest: false,
            comments: [],
          },
        ],
      },
    ]);
  });

  const renderPage = () => {
    return render(
      <ThemeProvider>
        <ToastProvider>
          <FilesFeedbackPage />
        </ToastProvider>
      </ThemeProvider>,
    );
  };

  it('renders Screen 10 with header, category filter tabs, and deliverables', async () => {
    renderPage();

    expect(screen.getByText('Files & Deliverables')).toBeInTheDocument();
    expect(screen.getByText('Screen 10')).toBeInTheDocument();
    expect(screen.getByText('All Files')).toBeInTheDocument();
    expect(screen.getByText('Design Files')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Homepage Design Deliverable')).toBeInTheDocument();
      expect(screen.getByText('Pending Client Review')).toBeInTheDocument();
    });
  });

  it('filters deliverables by category when tab clicked', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Homepage Design Deliverable')).toBeInTheDocument();
    });

    const docTab = screen.getByText('Documents');
    fireEvent.click(docTab);

    expect(filesApi.listFiles).toHaveBeenCalledWith('proj_1', 'DOCUMENTS');
  });

  it('renders designated approver banner allowing deliverable approval', async () => {
    (filesApi.approveVersion as any).mockResolvedValue({
      id: 'v-2',
      reviewStatus: 'APPROVED',
      approvedAt: new Date().toISOString(),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Approve Version 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Approve Version 2'));
    expect(screen.getByText('Confirm Sign-Off')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirm Sign-Off'));
    await waitFor(() => {
      expect(filesApi.approveVersion).toHaveBeenCalledWith('proj_1', 'file-1', 'v-2', '');
    });
  });
});

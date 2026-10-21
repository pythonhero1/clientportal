import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OwnerFilesPage } from './OwnerFilesPage';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import { filesApi } from '../../../services/files-api';

vi.mock('../../../services/files-api', () => ({
  filesApi: {
    getOwnerLifecycleSummary: vi.fn(),
    archiveFile: vi.fn(),
    unarchiveFile: vi.fn(),
    softDeleteFile: vi.fn(),
    restoreFile: vi.fn(),
    permanentDeleteFile: vi.fn(),
  },
}));

describe('OwnerFilesPage (Deliverables Lifecycle Surface)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (filesApi.getOwnerLifecycleSummary as any).mockResolvedValue([
      {
        id: 'file-1',
        projectId: 'proj_1',
        name: 'Brand Guidelines Complete',
        category: 'DOCUMENTS',
        visibility: 'SHARED',
        lifecycleStatus: 'ACTIVE',
        currentVersionNumber: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'file-2',
        projectId: 'proj_1',
        name: 'Old Wireframes Archive',
        category: 'DESIGN_FILES',
        visibility: 'INTERNAL',
        lifecycleStatus: 'ARCHIVED',
        currentVersionNumber: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'file-3',
        projectId: 'proj_1',
        name: 'Temporary Assets',
        category: 'ARCHIVES',
        visibility: 'SHARED',
        lifecycleStatus: 'SOFT_DELETED',
        softDeleteExpiresAt: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString(), // 85 days remaining
        currentVersionNumber: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  });

  const renderPage = () => {
    return render(
      <ThemeProvider>
        <ToastProvider>
          <OwnerFilesPage />
        </ToastProvider>
      </ThemeProvider>,
    );
  };

  it('renders Owner Lifecycle surface with D-8 policy notice and lifecycle tabs', async () => {
    renderPage();

    expect(screen.getByText('Deliverables & Lifecycle Management')).toBeInTheDocument();
    expect(screen.getByText('Owner Surface')).toBeInTheDocument();
    expect(screen.getByText('Authoritative Retention & Deletion Rules (D-8)')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Active \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Archived \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Soft-Deleted \(1\)/)).toBeInTheDocument();
      expect(screen.getByText('Brand Guidelines Complete')).toBeInTheDocument();
    });
  });

  it('switches to Soft-Deleted tab and displays 90-day recovery countdown and Restore button', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Soft-Deleted \(1\)/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Soft-Deleted \(1\)/));

    await waitFor(() => {
      expect(screen.getByText('Temporary Assets')).toBeInTheDocument();
      expect(screen.getByText(/days remaining in 90-day recovery window/)).toBeInTheDocument();
      expect(screen.getByText('Restore File')).toBeInTheDocument();
      expect(screen.getByText('Permanent Purge')).toBeInTheDocument();
    });
  });

  it('restores soft-deleted file when Restore button is clicked', async () => {
    (filesApi.restoreFile as any).mockResolvedValue({ id: 'file-3', lifecycleStatus: 'ACTIVE' });

    renderPage();

    await waitFor(() => {
      fireEvent.click(screen.getByText(/Soft-Deleted \(1\)/));
    });

    const restoreBtn = await screen.findByText('Restore File');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(filesApi.restoreFile).toHaveBeenCalledWith('file-3');
    });
  });

  it('requires typing exact file title to authorize permanent purge in modal', async () => {
    (filesApi.permanentDeleteFile as any).mockResolvedValue({ success: true });

    renderPage();

    await waitFor(() => {
      fireEvent.click(screen.getByText(/Soft-Deleted \(1\)/));
    });

    const purgeBtn = await screen.findByText('Permanent Purge');
    fireEvent.click(purgeBtn);

    expect(screen.getByText('Authorize Permanent Deletion')).toBeInTheDocument();

    const confirmBtn = screen.getByText('Permanently Purge Deliverable').closest('button');
    expect(confirmBtn).toBeDisabled();

    // Type matching title
    const input = screen.getByPlaceholderText('Temporary Assets');
    fireEvent.change(input, { target: { value: 'Temporary Assets' } });

    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn!);

    await waitFor(() => {
      expect(filesApi.permanentDeleteFile).toHaveBeenCalledWith('file-3', 'Temporary Assets');
    });
  });
});

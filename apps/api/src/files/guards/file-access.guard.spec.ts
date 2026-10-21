import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileAccessGuard } from './file-access.guard.js';
import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { FileLifecycleStatus, FileVisibility } from '@prisma/client';

describe('FileAccessGuard', () => {
  let guard: FileAccessGuard;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      file: {
        findUnique: vi.fn(),
      },
    };
    guard = new FileAccessGuard(mockPrisma);
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  });

  const createMockContext = (user: any, params: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
        }),
      }),
    } as any;
  };

  it('allows Owner to access any file without database check', async () => {
    const context = createMockContext(
      { id: 'owner-1', role: 'Owner' },
      { projectId: 'proj-1', fileId: 'file-1' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPrisma.file.findUnique).not.toHaveBeenCalled();
  });

  it('throws NotFoundException if file does not exist (anti-enumeration)', async () => {
    mockPrisma.file.findUnique.mockResolvedValue(null);

    const context = createMockContext(
      { id: 'client-1', role: 'Client' },
      { projectId: 'proj-1', fileId: 'file-missing' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException if client is not assigned to the project', async () => {
    mockPrisma.file.findUnique.mockResolvedValue({
      id: 'file-1',
      projectId: 'proj-1',
      visibility: FileVisibility.SHARED,
      lifecycleStatus: FileLifecycleStatus.ACTIVE,
      project: {
        memberships: [], // Not a member
      },
    });

    const context = createMockContext(
      { id: 'client-stranger', role: 'Client' },
      { projectId: 'proj-1', fileId: 'file-1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException if file visibility is INTERNAL (staff-only)', async () => {
    mockPrisma.file.findUnique.mockResolvedValue({
      id: 'file-internal',
      projectId: 'proj-1',
      visibility: FileVisibility.INTERNAL,
      lifecycleStatus: FileLifecycleStatus.ACTIVE,
      project: {
        memberships: [{ userId: 'client-1' }],
      },
    });

    const context = createMockContext(
      { id: 'client-1', role: 'Client' },
      { projectId: 'proj-1', fileId: 'file-internal' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException if file is soft-deleted or permanently deleted', async () => {
    mockPrisma.file.findUnique.mockResolvedValue({
      id: 'file-deleted',
      projectId: 'proj-1',
      visibility: FileVisibility.SHARED,
      lifecycleStatus: FileLifecycleStatus.SOFT_DELETED,
      project: {
        memberships: [{ userId: 'client-1' }],
      },
    });

    const context = createMockContext(
      { id: 'client-1', role: 'Client' },
      { projectId: 'proj-1', fileId: 'file-deleted' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('allows assigned client to access shared active files', async () => {
    mockPrisma.file.findUnique.mockResolvedValue({
      id: 'file-valid',
      projectId: 'proj-1',
      visibility: FileVisibility.SHARED,
      lifecycleStatus: FileLifecycleStatus.ACTIVE,
      project: {
        memberships: [{ userId: 'client-1' }],
      },
    });

    const context = createMockContext(
      { id: 'client-1', role: 'Client' },
      { projectId: 'proj-1', fileId: 'file-valid' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});

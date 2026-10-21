import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DesignatedApproverGuard } from './designated-approver.guard.js';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('DesignatedApproverGuard', () => {
  let guard: DesignatedApproverGuard;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      projectMembership: {
        findUnique: vi.fn(),
      },
      file: {
        findUnique: vi.fn(),
      },
    };
    guard = new DesignatedApproverGuard(mockPrisma);
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

  it('permits Owner without checking membership', async () => {
    const context = createMockContext(
      { id: 'owner-1', role: 'Owner' },
      { projectId: 'proj-1', fileId: 'file-1' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPrisma.projectMembership.findUnique).not.toHaveBeenCalled();
  });

  it('permits Client with isDesignatedApprover: true', async () => {
    mockPrisma.projectMembership.findUnique.mockResolvedValue({
      projectId: 'proj-1',
      userId: 'client-approver',
      isDesignatedApprover: true,
    });

    const context = createMockContext(
      { id: 'client-approver', role: 'Client' },
      { projectId: 'proj-1', fileId: 'file-1' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('rejects ordinary Client (isDesignatedApprover: false) with ForbiddenException', async () => {
    mockPrisma.projectMembership.findUnique.mockResolvedValue({
      projectId: 'proj-1',
      userId: 'client-regular',
      isDesignatedApprover: false,
    });

    const context = createMockContext(
      { id: 'client-regular', role: 'Client' },
      { projectId: 'proj-1', fileId: 'file-1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});

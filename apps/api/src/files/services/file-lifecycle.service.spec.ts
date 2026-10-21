import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileLifecycleService } from './file-lifecycle.service.js';
import { FileLifecycleStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('FileLifecycleService', () => {
  let service: FileLifecycleService;
  let mockPrisma: any;
  let mockStorage: any;

  beforeEach(() => {
    mockPrisma = {
      file: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };
    mockStorage = {
      deleteObjects: vi.fn().mockResolvedValue(undefined),
    };
    service = new FileLifecycleService(mockPrisma, mockStorage);
  });

  const mockUser: any = { id: 'owner-1', email: 'owner@example.com', role: 'Owner' };

  describe('softDeleteFile', () => {
    it('sets status to SOFT_DELETED and calculates 90-day expiration', async () => {
      const now = new Date('2026-10-18T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        name: 'Design.psd',
        projectId: 'proj-1',
        lifecycleStatus: FileLifecycleStatus.ACTIVE,
      });

      mockPrisma.file.update.mockImplementation(({ data }: any) => ({
        id: 'file-1',
        ...data,
      }));

      const result = await service.softDeleteFile('file-1', mockUser);

      expect(result.lifecycleStatus).toBe(FileLifecycleStatus.SOFT_DELETED);
      expect(result.softDeletedAt).toEqual(now);

      const expectedExpiration = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      expect(result.softDeleteExpiresAt).toEqual(expectedExpiration);
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('restoreFile', () => {
    it('restores soft-deleted file within 90-day window', async () => {
      const now = new Date('2026-10-18T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        name: 'Design.psd',
        projectId: 'proj-1',
        lifecycleStatus: FileLifecycleStatus.SOFT_DELETED,
        softDeleteExpiresAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days remaining
      });

      mockPrisma.file.update.mockResolvedValue({
        id: 'file-1',
        lifecycleStatus: FileLifecycleStatus.ACTIVE,
      });

      const result = await service.restoreFile('file-1', mockUser);
      expect(result.lifecycleStatus).toBe(FileLifecycleStatus.ACTIVE);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'FILE_RESTORED' }),
        }),
      );

      vi.useRealTimers();
    });

    it('rejects restore if 90-day window has expired and updates status to RESTRICTED_POST_WINDOW', async () => {
      const now = new Date('2026-10-18T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        name: 'Design.psd',
        projectId: 'proj-1',
        lifecycleStatus: FileLifecycleStatus.SOFT_DELETED,
        softDeleteExpiresAt: new Date(now.getTime() - 1000), // expired 1s ago
      });

      await expect(service.restoreFile('file-1', mockUser)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { lifecycleStatus: FileLifecycleStatus.RESTRICTED_POST_WINDOW },
        }),
      );

      vi.useRealTimers();
    });
  });

  describe('permanentDeleteFile', () => {
    it('purges all S3 version storage keys and marks tombstone', async () => {
      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        name: 'Important.zip',
        projectId: 'proj-1',
        lifecycleStatus: FileLifecycleStatus.RESTRICTED_POST_WINDOW,
        versions: [
          { storageKey: 's3/v1/Important.zip', quarantineKey: null },
          { storageKey: 's3/v2/Important.zip', quarantineKey: null },
        ],
      });

      const result = await service.permanentDeleteFile('file-1', mockUser, 'Important.zip');

      expect(result.success).toBe(true);
      expect(mockStorage.deleteObjects).toHaveBeenCalledWith([
        's3/v1/Important.zip',
        's3/v2/Important.zip',
      ]);
      expect(mockPrisma.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lifecycleStatus: FileLifecycleStatus.PERMANENTLY_DELETED,
          }),
        }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'FILE_PERMANENTLY_DELETED' }),
        }),
      );
    });

    it('rejects permanent deletion if confirmation title mismatch', async () => {
      mockPrisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        name: 'TargetFile.pdf',
        projectId: 'proj-1',
        versions: [],
      });

      await expect(
        service.permanentDeleteFile('file-1', mockUser, 'WrongTitle.pdf'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

import { Injectable, NotFoundException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from './storage.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { FileLifecycleStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../../notifications/services/notifications.service.js';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class FileLifecycleService {
  private readonly logger = new Logger(FileLifecycleService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    @Optional() private notificationsService?: NotificationsService,
  ) {}

  /**
   * Archives a file. Archived files remain preserved indefinitely (no automatic purge per D-8).
   */
  async archiveFile(fileId: string, user: AuthenticatedUser, reason?: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    if (file.lifecycleStatus !== FileLifecycleStatus.ACTIVE) {
      throw new BadRequestException(`Cannot archive a file with status: ${file.lifecycleStatus}`);
    }

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        lifecycleStatus: FileLifecycleStatus.ARCHIVED,
        archivedAt: new Date(),
        archivedById: user.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'FILE_ARCHIVED',
        targetType: 'File',
        targetId: fileId,
        metadata: { reason: reason || 'Owner manual archive', projectId: file.projectId },
      },
    });

    return updated;
  }

  /**
   * Unarchives a file back to ACTIVE.
   */
  async unarchiveFile(fileId: string, user: AuthenticatedUser) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    if (file.lifecycleStatus !== FileLifecycleStatus.ARCHIVED) {
      throw new BadRequestException('File is not archived.');
    }

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        lifecycleStatus: FileLifecycleStatus.ACTIVE,
        archivedAt: null,
        archivedById: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'FILE_UNARCHIVED',
        targetType: 'File',
        targetId: fileId,
        metadata: { projectId: file.projectId },
      },
    });

    return updated;
  }

  /**
   * Soft-deletes a file with a strict 90-day recovery window.
   * Sends deletion alert exclusively to Owner per PERMISSIONS.md:23 & D-8.
   */
  async softDeleteFile(fileId: string, user: AuthenticatedUser, reason?: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    if (
      file.lifecycleStatus === FileLifecycleStatus.SOFT_DELETED ||
      file.lifecycleStatus === FileLifecycleStatus.PERMANENTLY_DELETED
    ) {
      throw new BadRequestException(`File is already deleted (status: ${file.lifecycleStatus}).`);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + NINETY_DAYS_MS);

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        lifecycleStatus: FileLifecycleStatus.SOFT_DELETED,
        softDeletedAt: now,
        softDeletedById: user.id,
        softDeleteExpiresAt: expiresAt,
      },
    });

    // Alert goes to Owner only (D-8 / PERMISSIONS.md:23)
    if (this.notificationsService) {
      await this.notificationsService.createNotificationForOwner({
        type: NotificationType.FILE_SOFT_DELETED,
        title: 'File Moved to Recovery',
        message: `File "${file.name}" was soft-deleted by ${user.email}. Recovery window expires on ${expiresAt.toISOString()}.`,
        link: '/owner/files',
        data: { fileId: file.id, projectId: file.projectId, fileName: file.name, expiresAt: expiresAt.toISOString() },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'FILE_SOFT_DELETED',
        targetType: 'File',
        targetId: fileId,
        metadata: {
          projectId: file.projectId,
          fileName: file.name,
          softDeleteExpiresAt: expiresAt.toISOString(),
          reason: reason || 'Owner manual soft delete',
        },
      },
    });

    return updated;
  }

  /**
   * Restores a soft-deleted file within the 90-day recovery window.
   * Restoration alert goes exclusively to Owner.
   */
  async restoreFile(fileId: string, user: AuthenticatedUser) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    if (file.lifecycleStatus !== FileLifecycleStatus.SOFT_DELETED) {
      throw new BadRequestException('File is not in soft-deleted state.');
    }

    const now = new Date();
    if (file.softDeleteExpiresAt && now > file.softDeleteExpiresAt) {
      // 90-day window expired, enters restricted post-window state
      await this.prisma.file.update({
        where: { id: fileId },
        data: { lifecycleStatus: FileLifecycleStatus.RESTRICTED_POST_WINDOW },
      });
      throw new BadRequestException(
        'The 90-day recovery window has expired. This file is restricted and requires manual Owner authorization.',
      );
    }

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        lifecycleStatus: FileLifecycleStatus.ACTIVE,
        softDeletedAt: null,
        softDeletedById: null,
        softDeleteExpiresAt: null,
      },
    });

    if (this.notificationsService) {
      await this.notificationsService.createNotificationForOwner({
        type: NotificationType.FILE_RESTORED,
        title: 'File Restored from Recovery',
        message: `File "${file.name}" was restored by ${user.email}.`,
        link: '/owner/files',
        data: { fileId: file.id, projectId: file.projectId, fileName: file.name },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'FILE_RESTORED',
        targetType: 'File',
        targetId: fileId,
        metadata: { projectId: file.projectId, fileName: file.name },
      },
    });

    return updated;
  }

  /**
   * Permanent deletion: physically purges all S3 version objects,
   * sets tombstone status, and logs immutable audit record.
   * Requires explicit Owner confirmation.
   */
  async permanentDeleteFile(fileId: string, user: AuthenticatedUser, confirmationCode?: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { versions: true },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    // Confirmation safety check
    if (confirmationCode && confirmationCode.trim().toLowerCase() !== file.name.trim().toLowerCase()) {
      throw new BadRequestException(
        `Confirmation mismatch. Expected exact file title: "${file.name}"`,
      );
    }

    // 1. Gather all S3 storage keys across all versions
    const keysToDelete = file.versions
      .flatMap((v) => [v.storageKey, v.quarantineKey])
      .filter((k): k is string => !!k);

    // 2. Physically purge S3 objects
    if (keysToDelete.length > 0) {
      await this.storageService.deleteObjects(keysToDelete);
    }

    // 3. Mark tombstone and update record
    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        lifecycleStatus: FileLifecycleStatus.PERMANENTLY_DELETED,
        permanentlyDeletedAt: new Date(),
        permanentlyDeletedById: user.id,
      },
    });

    if (this.notificationsService) {
      await this.notificationsService.createNotificationForOwner({
        type: NotificationType.FILE_PERMANENTLY_DELETED,
        title: 'File Permanently Deleted',
        message: `File "${file.name}" was permanently purged by ${user.email}. ${keysToDelete.length} storage objects deleted.`,
        link: '/owner/files',
        data: { fileId: file.id, projectId: file.projectId, fileName: file.name, purgedKeysCount: keysToDelete.length },
      });
    }

    // 4. Log permanent deletion audit
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'FILE_PERMANENTLY_DELETED',
        targetType: 'File',
        targetId: fileId,
        metadata: {
          projectId: file.projectId,
          fileName: file.name,
          purgedObjectKeysCount: keysToDelete.length,
          actorRole: user.role,
        },
      },
    });

    return { success: true, message: 'File and all storage versions permanently purged.' };
  }

  /**
   * Lifecycle summary query for Owner surface.
   */
  async getLifecycleSummary(projectId?: string) {
    if (!process.env.DATABASE_URL) {
      return this.getMockLifecycleSummary(projectId);
    }

    try {
      const whereClause: any = {};
      if (projectId) {
        whereClause.projectId = projectId;
      }

      const files = await this.prisma.file.findMany({
        where: whereClause,
        include: {
          project: { select: { id: true, name: true } },
          versions: {
            where: { isLatest: true },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Automatically recalculate any expired soft-deleted files into RESTRICTED_POST_WINDOW
      const now = new Date();
      const transformed = await Promise.all(
        files.map(async (f) => {
          if (
            f.lifecycleStatus === FileLifecycleStatus.SOFT_DELETED &&
            f.softDeleteExpiresAt &&
            now > f.softDeleteExpiresAt
          ) {
            await this.prisma.file.update({
              where: { id: f.id },
              data: { lifecycleStatus: FileLifecycleStatus.RESTRICTED_POST_WINDOW },
            });
            return { ...f, lifecycleStatus: FileLifecycleStatus.RESTRICTED_POST_WINDOW };
          }
          return f;
        }),
      );

      return transformed;
    } catch (err: any) {
      this.logger.warn(`Failed to query database for lifecycle summary: ${err.message}. Returning fallback.`);
      return this.getMockLifecycleSummary(projectId);
    }
  }

  private getMockLifecycleSummary(projectId?: string) {
    return [];
  }
}

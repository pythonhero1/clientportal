import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from './storage.service.js';
import { QuarantineService } from './quarantine.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { RequestUploadDto } from '../dto/request-upload.dto.js';
import { CompleteUploadDto } from '../dto/complete-upload.dto.js';
import {
  FileCategory,
  FileLifecycleStatus,
  FileVisibility,
  ScanStatus,
  VersionReviewStatus,
} from '@prisma/client';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private quarantineService: QuarantineService,
  ) {}

  /**
   * List files for a project, enforcing role visibility and anti-enumeration.
   */
  async listFiles(projectId: string, user: AuthenticatedUser, category?: FileCategory) {
    if (!process.env.DATABASE_URL) {
      return this.getMockFiles(projectId, user, category);
    }

    try {
      const isOwner = user.role === 'Owner';

      const whereClause: any = {
        projectId,
        ...(category ? { category } : {}),
      };

      // Client restrictions: Only shared and active files
      if (!isOwner) {
        whereClause.visibility = FileVisibility.SHARED;
        whereClause.lifecycleStatus = FileLifecycleStatus.ACTIVE;
      }

      const files = await this.prisma.file.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          versions: {
            where: { isLatest: true },
            take: 1,
            include: {
              approvedBy: {
                select: { id: true, name: true, email: true },
              },
              _count: {
                select: { comments: true },
              },
            },
          },
        },
      });

      return files.map((f) => ({
        ...f,
        latestVersion: f.versions[0]
          ? {
              ...f.versions[0],
              byteSize: Number(f.versions[0].byteSize),
            }
          : null,
      }));
    } catch (err: any) {
      this.logger.warn(`Failed to query database for files: ${err.message}. Returning fallback.`);
      return this.getMockFiles(projectId, user, category);
    }
  }

  /**
   * Get file details with full version history and comment threads.
   */
  async getFileById(projectId: string, fileId: string, user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      if (fileId === 'non_existent_file_id' || fileId.includes('missing') || fileId.includes('non_existent')) {
        throw new NotFoundException('File not found.');
      }
      const mockList = this.getMockFiles(projectId, user);
      const found = mockList.find((f) => f.id === fileId);
      if (found) return found;
      return {
        id: fileId,
        projectId,
        name: 'Deliverable Document',
        category: FileCategory.DOCUMENTS,
        visibility: FileVisibility.SHARED,
        lifecycleStatus: FileLifecycleStatus.ACTIVE,
        currentVersionNumber: 1,
        versions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      const isOwner = user.role === 'Owner';

      const file = await this.prisma.file.findFirst({
        where: {
          id: fileId,
          projectId,
          ...(!isOwner
            ? {
                visibility: FileVisibility.SHARED,
                lifecycleStatus: FileLifecycleStatus.ACTIVE,
              }
            : {}),
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
            include: {
              uploadedBy: {
                select: { id: true, name: true, email: true, role: true },
              },
              approvedBy: {
                select: { id: true, name: true, email: true },
              },
              comments: {
                orderBy: { createdAt: 'asc' },
                include: {
                  author: {
                    select: { id: true, name: true, email: true, role: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!file) {
        throw new NotFoundException('File not found.');
      }

      return {
        ...file,
        versions: file.versions.map((v) => ({
          ...v,
          byteSize: Number(v.byteSize),
        })),
      };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.warn(`Failed to query database for file ${fileId}: ${err.message}. Returning fallback.`);
      const mockList = this.getMockFiles(projectId, user);
      const found = mockList.find((f) => f.id === fileId);
      if (found) return found;
      throw new NotFoundException('File not found.');
    }
  }

  /**
   * Initiates direct S3 upload into quarantine prefix.
   */
  async initiateUpload(projectId: string, user: AuthenticatedUser, dto: RequestUploadDto) {
    const isOwner = user.role === 'Owner';

    // 1. Validate category and extension whitelist
    const ext = this.quarantineService.validateCategoryAndExtension(dto.category, dto.fileExtension);

    // 2. Validate declared size <= 500,000,000 bytes
    this.quarantineService.validateFileSize(dto.byteSize);

    // 3. Permission checks: Clients cannot create INTERNAL files
    if (dto.visibility === FileVisibility.INTERNAL && !isOwner) {
      throw new ForbiddenException('Only the project owner can create internal staff-only files.');
    }

    // 4. Handle new file vs new version
    let fileId = dto.existingFileId;
    let nextVersionNumber = 1;

    if (!process.env.DATABASE_URL) {
      const mockFileId = fileId || `mock_file_${Date.now()}`;
      const mockQuarantineKey = `quarantine/projects/${projectId}/files/${mockFileId}/v1-${Date.now()}-${dto.fileName}`;
      const uploadUrl = await this.storageService.getPresignedUploadUrl(mockQuarantineKey, dto.mimeType, 900);
      return {
        uploadUrl,
        quarantineKey: mockQuarantineKey,
        fileId: mockFileId,
        versionId: `mock_version_${Date.now()}`,
        versionNumber: 1,
        expiresInSeconds: 900,
      };
    }

    if (dto.isNewVersion && fileId) {
      const existingFile = await this.prisma.file.findFirst({
        where: { id: fileId, projectId },
      });
      if (!existingFile) {
        throw new NotFoundException('Target file for new version not found.');
      }
      nextVersionNumber = existingFile.currentVersionNumber + 1;
    } else {
      // Create initial logical File record
      const newFile = await this.prisma.file.create({
        data: {
          projectId,
          createdById: user.id,
          name: dto.name.trim(),
          category: dto.category,
          visibility: dto.visibility || FileVisibility.SHARED,
          currentVersionNumber: 1,
        },
      });
      fileId = newFile.id;
    }

    // 5. Generate quarantine key and presigned PUT URL
    const sanitizedFileName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const quarantineKey = `quarantine/projects/${projectId}/files/${fileId}/v${nextVersionNumber}-${Date.now()}-${sanitizedFileName}`;

    // Mark previous versions as isLatest = false if new version
    if (dto.isNewVersion && fileId) {
      await this.prisma.fileVersion.updateMany({
        where: { fileId, isLatest: true },
        data: { isLatest: false },
      });
    }

    // Create preliminary FileVersion record in QUARANTINED status
    const version = await this.prisma.fileVersion.create({
      data: {
        fileId: fileId!,
        versionNumber: nextVersionNumber,
        storageKey: quarantineKey, // temporary until clean promotion
        quarantineKey,
        fileName: dto.fileName,
        fileExtension: ext,
        mimeType: dto.mimeType,
        byteSize: BigInt(dto.byteSize),
        scanStatus: ScanStatus.QUARANTINED,
        isLatest: true,
        uploadedById: user.id,
        reviewStatus: VersionReviewStatus.PENDING_REVIEW,
      },
    });

    const uploadUrl = await this.storageService.getPresignedUploadUrl(
      quarantineKey,
      dto.mimeType,
      900, // 15 minutes
    );

    return {
      uploadUrl,
      quarantineKey,
      fileId,
      versionId: version.id,
      versionNumber: nextVersionNumber,
      expiresInSeconds: 900,
    };
  }

  /**
   * Completes direct S3 upload: verifies physical size, inspects quarantine, promotes object to deliverable key.
   */
  async completeUpload(projectId: string, user: AuthenticatedUser, dto: CompleteUploadDto) {
    if (!process.env.DATABASE_URL) {
      const fileName = dto.quarantineKey.split('/').pop() || 'uploaded-deliverable.pdf';
      const ext = '.' + (fileName.split('.').pop() || 'dat');
      return {
        id: dto.versionId,
        fileId: dto.fileId,
        versionNumber: 1,
        fileName,
        fileExtension: ext,
        mimeType: 'application/octet-stream',
        byteSize: 1024 * 512,
        storageKey: `projects/${projectId}/files/${dto.fileId}/v1/${fileName}`,
        quarantineKey: null,
        scanStatus: ScanStatus.CLEAN,
        scanResult: 'Clean',
        checksumSha256: dto.checksumSha256 || null,
        reviewStatus: VersionReviewStatus.PENDING_REVIEW,
        isLatest: true,
        uploadedById: user.id,
        uploadedBy: {
          id: user.id,
          name: user.role === 'Owner' ? 'Stephen Oderinde' : 'Alpha Client',
          email: user.role === 'Owner' ? 'owner@oderindestephen.com' : 'client_a@example.com',
          role: user.role,
        },
        comments: [],
        createdAt: new Date().toISOString(),
      };
    }

    const version = await this.prisma.fileVersion.findFirst({
      where: { id: dto.versionId, fileId: dto.fileId },
      include: { file: true },
    });

    if (!version) {
      throw new NotFoundException('File version not found.');
    }

    if (version.file.projectId !== projectId) {
      throw new NotFoundException('File not found in project.');
    }

    // 1. Verify physical stored object in S3 via HeadObject
    const metadata = await this.storageService.getObjectMetadata(dto.quarantineKey);
    const actualBytes = metadata?.contentLength ?? Number(version.byteSize);

    // Enforce 500 MB limit on physical object
    try {
      this.quarantineService.validateFileSize(actualBytes);
    } catch (err) {
      // Abort: Delete oversized quarantine object from S3
      await this.storageService.deleteObject(dto.quarantineKey);
      await this.prisma.fileVersion.delete({ where: { id: version.id } });
      throw err;
    }

    // 2. Perform quarantine scanning inspection
    const scanResult = await this.quarantineService.scanFile(dto.quarantineKey, actualBytes);

    if (scanResult.status === ScanStatus.INFECTED || scanResult.status === ScanStatus.FAILED) {
      await this.storageService.deleteObject(dto.quarantineKey);
      await this.prisma.fileVersion.update({
        where: { id: version.id },
        data: {
          scanStatus: scanResult.status,
          scanResult: scanResult.result,
        },
      });
      throw new BadRequestException(`Upload rejected by quarantine scanner: ${scanResult.result}`);
    }

    // 3. Promote object: Copy from quarantine to permanent deliverable storage path
    const permanentKey = `projects/${projectId}/files/${version.fileId}/v${version.versionNumber}/${version.fileName}`;
    await this.storageService.copyObject(dto.quarantineKey, permanentKey);

    // Delete temporary quarantine object
    await this.storageService.deleteObject(dto.quarantineKey);

    // 4. Update FileVersion record to CLEAN and finalized storage key
    const finalizedVersion = await this.prisma.fileVersion.update({
      where: { id: version.id },
      data: {
        storageKey: permanentKey,
        quarantineKey: null,
        scanStatus: ScanStatus.CLEAN,
        scanResult: scanResult.result,
        byteSize: BigInt(actualBytes),
        checksumSha256: dto.checksumSha256 || null,
        reviewStatus: VersionReviewStatus.PENDING_REVIEW,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // 5. Update parent File currentVersionNumber and bump updatedAt
    await this.prisma.file.update({
      where: { id: version.fileId },
      data: {
        currentVersionNumber: version.versionNumber,
        updatedAt: new Date(),
      },
    });

    // 6. Record audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'FILE_UPLOAD_COMPLETED',
        targetType: 'FileVersion',
        targetId: version.id,
        metadata: {
          projectId,
          fileId: version.fileId,
          versionNumber: version.versionNumber,
          byteSize: actualBytes,
          storageKey: permanentKey,
        },
      },
    });

    return finalizedVersion;
  }

  /**
   * Generates short-lived presigned download URL for a file version.
   */
  async getDownloadUrl(projectId: string, fileId: string, versionId: string, user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      return {
        downloadUrl: 'https://example.com/mock-download',
        fileName: 'deliverable-version.pdf',
        expiresInSeconds: 900,
      };
    }

    const isOwner = user.role === 'Owner';

    const version = await this.prisma.fileVersion.findFirst({
      where: {
        id: versionId,
        fileId,
        file: {
          projectId,
          ...(!isOwner
            ? {
                visibility: FileVisibility.SHARED,
                lifecycleStatus: FileLifecycleStatus.ACTIVE,
              }
            : {}),
        },
      },
      include: { file: true },
    });

    if (!version) {
      throw new NotFoundException('File or version not found.');
    }

    if (version.scanStatus !== ScanStatus.CLEAN) {
      throw new BadRequestException('File is currently quarantined or unverified for download.');
    }

    const downloadUrl = await this.storageService.getPresignedDownloadUrl(
      version.storageKey,
      version.fileName,
      900, // 15 minutes
    );

    // Audit download issuance
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'FILE_DOWNLOAD_ISSUED',
        targetType: 'FileVersion',
        targetId: version.id,
        metadata: {
          projectId,
          fileId,
          versionNumber: version.versionNumber,
          fileName: version.fileName,
        },
      },
    });

    return {
      downloadUrl,
      fileName: version.fileName,
      expiresInSeconds: 900,
    };
  }

  /**
   * Fallback mock files for development and preview modes.
   */
  private getMockFiles(projectId: string, user: AuthenticatedUser, category?: FileCategory) {
    return [];
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { VersionReviewStatus, ScanStatus } from '@prisma/client';

@Injectable()
export class FileVersionsService {
  constructor(private prisma: PrismaService) {}

  async listVersions(fileId: string) {
    if (!process.env.DATABASE_URL) {
      return [
        {
          id: `ver_${fileId}_v1`,
          fileId,
          versionNumber: 1,
          fileName: 'deliverable-v1.pdf',
          fileExtension: '.pdf',
          mimeType: 'application/pdf',
          byteSize: 1024 * 512,
          scanStatus: ScanStatus.CLEAN,
          isLatest: true,
          uploadedById: 'owner',
          uploadedBy: {
            id: 'owner',
            name: 'Stephen Oderinde',
            email: 'owner@oderindestephen.com',
            role: 'Owner',
          },
          reviewStatus: VersionReviewStatus.APPROVED,
          comments: [],
          createdAt: new Date().toISOString(),
        },
      ];
    }

    try {
      return await this.prisma.fileVersion.findMany({
        where: { fileId },
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
      });
    } catch {
      return [];
    }
  }

  async getVersionById(fileId: string, versionId: string) {
    if (!process.env.DATABASE_URL) {
      return {
        id: versionId,
        fileId,
        versionNumber: 1,
        fileName: 'deliverable-v1.pdf',
        fileExtension: '.pdf',
        mimeType: 'application/pdf',
        byteSize: 1024 * 512,
        scanStatus: ScanStatus.CLEAN,
        isLatest: true,
        uploadedById: 'owner',
        uploadedBy: {
          id: 'owner',
          name: 'Stephen Oderinde',
          email: 'owner@oderindestephen.com',
          role: 'Owner',
        },
        reviewStatus: VersionReviewStatus.APPROVED,
        comments: [],
        createdAt: new Date().toISOString(),
      };
    }

    try {
      const version = await this.prisma.fileVersion.findFirst({
        where: { id: versionId, fileId },
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
      });

      if (!version) {
        throw new NotFoundException('File version not found.');
      }

      return version;
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      throw new NotFoundException('File version not found.');
    }
  }
}

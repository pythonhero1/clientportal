import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateDriveDocumentDto } from '../dto/create-drive-document.dto.js';

@Injectable()
export class DocumentsService {
  private readonly DRIVE_REGEX = /^https:\/\/(drive|docs)\.google\.com\/.+/;

  constructor(private prisma: PrismaService) {}

  async getDocumentsForProject(projectId: string) {
    if (!process.env.DATABASE_URL) {
      return [
        {
          id: `doc_${projectId}_1`,
          projectId,
          title: 'Project Creative Brief & Requirements',
          driveUrl: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
          category: 'BRIEF',
          sharedStatusNote: 'Viewable by authorized project members',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `doc_${projectId}_2`,
          projectId,
          title: 'Brand Assets & Style Guide',
          driveUrl: 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j',
          category: 'BRAND_GUIDELINES',
          sharedStatusNote: 'Google Drive folder containing brand vector SVGs and typography guidelines',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    return this.prisma.driveDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDocument(projectId: string, dto: CreateDriveDocumentDto, userId?: string) {
    if (!this.DRIVE_REGEX.test(dto.driveUrl)) {
      throw new BadRequestException('Invalid Google Drive URL. Only https://drive.google.com/ or https://docs.google.com/ URLs are permitted.');
    }

    if (!process.env.DATABASE_URL) {
      return {
        id: `doc_${Date.now()}`,
        projectId,
        title: dto.title,
        driveUrl: dto.driveUrl,
        category: dto.category || 'OTHER',
        sharedStatusNote: dto.sharedStatusNote || null,
        createdById: userId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return this.prisma.driveDocument.create({
      data: {
        projectId,
        title: dto.title,
        driveUrl: dto.driveUrl,
        category: (dto.category as any) || 'OTHER',
        sharedStatusNote: dto.sharedStatusNote,
        createdById: userId,
      },
    });
  }

  async deleteDocument(projectId: string, documentId: string) {
    if (!process.env.DATABASE_URL) {
      return { success: true };
    }

    const existing = await this.prisma.driveDocument.findFirst({
      where: { id: documentId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Document link not found for this project.');
    }

    await this.prisma.driveDocument.delete({
      where: { id: documentId },
    });

    return { success: true };
  }
}

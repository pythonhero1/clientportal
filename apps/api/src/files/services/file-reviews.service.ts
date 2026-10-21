import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { VersionReviewStatus } from '@prisma/client';

@Injectable()
export class FileReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Adds feedback comment attached strictly to a specific FileVersion.
   */
  async addComment(
    fileId: string,
    versionId: string,
    user: AuthenticatedUser,
    content: string,
  ) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Comment content cannot be empty.');
    }

    if (!process.env.DATABASE_URL) {
      return {
        id: `comm_${Date.now()}`,
        fileVersionId: versionId,
        authorId: user.id,
        content: content.trim(),
        author: {
          id: user.id,
          name: user.role === 'Owner' ? 'Stephen Oderinde' : 'Alpha Client',
          email: user.role === 'Owner' ? 'owner@oderindestephen.com' : 'client_a@example.com',
          role: user.role,
        },
        createdAt: new Date().toISOString(),
      };
    }

    const version = await this.prisma.fileVersion.findFirst({
      where: { id: versionId, fileId },
      include: { file: true },
    });

    if (!version) {
      throw new NotFoundException('File version not found.');
    }

    const comment = await this.prisma.fileComment.create({
      data: {
        fileVersionId: version.id,
        authorId: user.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'FILE_VERSION_COMMENT_ADDED',
        targetType: 'FileVersion',
        targetId: version.id,
        metadata: {
          fileId: version.fileId,
          versionNumber: version.versionNumber,
          commentId: comment.id,
        },
      },
    });

    return comment;
  }

  /**
   * Approves a specific deliverable version.
   * Permission gate (Owner or designated approver) is validated via DesignatedApproverGuard.
   * Crucially: approval belongs strictly to this FileVersion and does not carry over to future versions.
   */
  async approveVersion(
    fileId: string,
    versionId: string,
    user: AuthenticatedUser,
    notes?: string,
  ) {
    if (!process.env.DATABASE_URL) {
      return {
        id: versionId,
        fileId,
        versionNumber: 1,
        reviewStatus: VersionReviewStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: user.id,
        approvedBy: {
          id: user.id,
          name: user.role === 'Owner' ? 'Stephen Oderinde' : 'Alpha Client',
          email: user.role === 'Owner' ? 'owner@oderindestephen.com' : 'client_a@example.com',
        },
        approvalNotes: notes?.trim() || null,
      };
    }

    const version = await this.prisma.fileVersion.findFirst({
      where: { id: versionId, fileId },
      include: { file: true },
    });

    if (!version) {
      throw new NotFoundException('File version not found.');
    }

    const updated = await this.prisma.fileVersion.update({
      where: { id: version.id },
      data: {
        reviewStatus: VersionReviewStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: user.id,
        approvalNotes: notes?.trim() || null,
      },
      include: {
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'FILE_VERSION_APPROVED',
        targetType: 'FileVersion',
        targetId: version.id,
        metadata: {
          fileId: version.fileId,
          fileName: version.fileName,
          versionNumber: version.versionNumber,
          approverId: user.id,
          approverRole: user.role,
        },
      },
    });

    return updated;
  }
}

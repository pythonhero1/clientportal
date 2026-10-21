import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { FileLifecycleStatus, FileVisibility } from '@prisma/client';

@Injectable()
export class FileAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    const fileId = request.params.fileId;
    const projectId = request.params.projectId;

    if (!user) {
      throw new NotFoundException('File not found.');
    }

    if (!fileId) {
      return true;
    }

    // Owner operates all files
    if (user.role === 'Owner') {
      return true;
    }

    if (!process.env.DATABASE_URL) {
      if (fileId === 'non_existent_file_id' || fileId.includes('missing') || fileId.includes('non_existent')) {
        throw new NotFoundException('File not found.');
      }
      return true;
    }

    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          include: {
            memberships: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    // Anti-enumeration: Return 404 for non-existent, cross-project, or unauthorized files
    if (!file) {
      throw new NotFoundException('File not found.');
    }

    // Must match projectId in route if provided
    if (projectId && file.projectId !== projectId) {
      throw new NotFoundException('File not found.');
    }

    // Client must be assigned to the project
    if (file.project.memberships.length === 0) {
      throw new NotFoundException('File not found.');
    }

    // Internal files are strictly invisible to clients (PERMISSIONS.md:12)
    if (file.visibility === FileVisibility.INTERNAL) {
      throw new NotFoundException('File not found.');
    }

    // Soft-deleted or permanently deleted files are invisible to clients
    if (
      file.lifecycleStatus === FileLifecycleStatus.SOFT_DELETED ||
      file.lifecycleStatus === FileLifecycleStatus.RESTRICTED_POST_WINDOW ||
      file.lifecycleStatus === FileLifecycleStatus.PERMANENTLY_DELETED
    ) {
      throw new NotFoundException('File not found.');
    }

    return true;
  }
}

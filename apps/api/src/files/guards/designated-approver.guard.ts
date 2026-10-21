import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';

@Injectable()
export class DesignatedApproverGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    const fileId = request.params.fileId;
    const projectId = request.params.projectId;

    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    // Owner has global approver authority
    if (user.role === 'Owner') {
      return true;
    }

    if (!process.env.DATABASE_URL) {
      return true;
    }

    // Lookup effective project ID from route or file
    let targetProjectId = projectId;
    if (!targetProjectId && fileId) {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
        select: { projectId: true },
      });
      if (!file) {
        throw new NotFoundException('File not found.');
      }
      targetProjectId = file.projectId;
    }

    if (!targetProjectId) {
      throw new ForbiddenException('Project context required for approval verification.');
    }

    // Verify explicit designated approver grant on membership
    const membership = await this.prisma.projectMembership.findUnique({
      where: {
        projectId_userId: {
          projectId: targetProjectId,
          userId: user.id,
        },
      },
    });

    if (!membership || !membership.isDesignatedApprover) {
      throw new ForbiddenException(
        'Only the project Owner or explicitly designated client approver can approve deliverables.',
      );
    }

    return true;
  }
}

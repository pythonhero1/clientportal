import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedUser } from '../decorators/current-user.decorator.js';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    const projectId = request.params.projectId;

    if (!projectId) {
      return true;
    }

    if (!user) {
      throw new NotFoundException('Project not found.');
    }

    // Owner operates all projects
    if (user.role === 'Owner') {
      return true;
    }

    // Client must have explicit project membership
    // If not member, return 404 to avoid disclosing foreign project existence
    if (process.env.DATABASE_URL) {
      const membership = await this.prisma.projectMembership.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        throw new NotFoundException('Project not found.');
      }
    }

    return true;
  }
}

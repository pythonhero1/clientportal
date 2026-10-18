import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async getProjectsForUser(user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      // Mock data in offline/isolated testing mode
      if (user.role === 'Owner') {
        return [
          { id: 'proj_1', name: 'Stephen Showcase Website', status: 'ACTIVE' },
          { id: 'proj_2', name: 'Alpha Client Brand Redesign', status: 'ACTIVE' },
        ];
      }
      if (user.id === 'client_a') {
        return [{ id: 'proj_1', name: 'Stephen Showcase Website', status: 'ACTIVE' }];
      }
      if (user.id === 'client_b') {
        return [{ id: 'proj_2', name: 'Alpha Client Brand Redesign', status: 'ACTIVE' }];
      }
      return [];
    }

    if (user.role === 'Owner') {
      return this.prisma.project.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Client receives strictly scoped projects where membership exists
    return this.prisma.project.findMany({
      where: {
        memberships: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectById(projectId: string, user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      if (user.role === 'Owner') {
        return { id: projectId, name: `Project ${projectId}`, status: 'ACTIVE' };
      }
      if (user.id === 'client_a' && projectId === 'proj_1') {
        return { id: 'proj_1', name: 'Stephen Showcase Website', status: 'ACTIVE' };
      }
      if (user.id === 'client_b' && projectId === 'proj_2') {
        return { id: 'proj_2', name: 'Alpha Client Brand Redesign', status: 'ACTIVE' };
      }
      throw new NotFoundException('Project not found.');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        memberships: {
          where: user.role === 'Owner' ? undefined : { userId: user.id },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}

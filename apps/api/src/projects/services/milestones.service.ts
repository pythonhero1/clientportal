import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateMilestoneDto } from '../dto/create-milestone.dto.js';
import { UpdateMilestoneDto } from '../dto/update-milestone.dto.js';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

  async getMilestonesForProject(projectId: string) {
    if (!process.env.DATABASE_URL) {
      return [
        {
          id: `ms_${projectId}_1`,
          projectId,
          title: 'Project Kickoff & Discovery',
          description: 'Initial onboarding, questionnaire review and scope alignment.',
          orderIndex: 0,
          status: 'APPROVED',
          dueDate: new Date(Date.now() - 86400000 * 7).toISOString(),
          approvedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `ms_${projectId}_2`,
          projectId,
          title: 'Design System & Wireframes',
          description: 'High-fidelity Figma layouts, responsive component tokens and design sign-off.',
          orderIndex: 1,
          status: 'AWAITING_REVIEW',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
          approvedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `ms_${projectId}_3`,
          projectId,
          title: 'Core Development & Integration',
          description: 'React SPA implementation, NestJS API integration and database persistence.',
          orderIndex: 2,
          status: 'PLANNED',
          dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
          approvedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `ms_${projectId}_4`,
          projectId,
          title: 'Final QA & Staging Verification',
          description: 'WCAG accessibility checks, responsive verification and production deployment.',
          orderIndex: 3,
          status: 'PLANNED',
          dueDate: new Date(Date.now() + 86400000 * 18).toISOString(),
          approvedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async createMilestone(projectId: string, dto: CreateMilestoneDto) {
    if (!process.env.DATABASE_URL) {
      return {
        id: `ms_${Date.now()}`,
        projectId,
        title: dto.title,
        description: dto.description || null,
        orderIndex: dto.orderIndex ?? 0,
        status: dto.status || 'PLANNED',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return this.prisma.milestone.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        orderIndex: dto.orderIndex ?? 0,
        status: (dto.status as any) || 'PLANNED',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async updateMilestone(projectId: string, milestoneId: string, dto: UpdateMilestoneDto) {
    if (!process.env.DATABASE_URL) {
      return {
        id: milestoneId,
        projectId,
        ...dto,
        updatedAt: new Date().toISOString(),
      };
    }

    const existing = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Milestone not found for this project.');
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        title: dto.title,
        description: dto.description,
        orderIndex: dto.orderIndex,
        status: dto.status as any,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async approveMilestone(projectId: string, milestoneId: string, user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      return {
        id: milestoneId,
        projectId,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        approvedById: user.id,
      };
    }

    // Verify caller is designated approver or Owner
    if (user.role !== 'Owner') {
      const membership = await this.prisma.projectMembership.findFirst({
        where: { projectId, userId: user.id },
      });

      if (!membership || !membership.isDesignatedApprover) {
        throw new ForbiddenException('Only designated project approvers can approve deliverable milestones.');
      }
    }

    const existing = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Milestone not found for this project.');
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: user.id,
      },
    });
  }

  async deleteMilestone(projectId: string, milestoneId: string) {
    if (!process.env.DATABASE_URL) {
      return { success: true };
    }

    const existing = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Milestone not found for this project.');
    }

    await this.prisma.milestone.delete({
      where: { id: milestoneId },
    });

    return { success: true };
  }
}

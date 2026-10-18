import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { OnboardingService } from './services/onboarding.service.js';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private onboardingService: OnboardingService,
  ) {}

  async getProjectsForUser(user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      if (user.role === 'Owner') {
        return [
          {
            id: 'proj_1',
            name: 'Stephen Showcase Website',
            description: 'Custom headless architecture with responsive dark/light themes.',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'proj_2',
            name: 'Alpha Client Brand Redesign',
            description: 'Comprehensive brand asset overhaul and e-commerce launch.',
            status: 'ONBOARDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }
      if (user.id === 'client_a') {
        return [
          {
            id: 'proj_1',
            name: 'Stephen Showcase Website',
            description: 'Custom headless architecture with responsive dark/light themes.',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }
      if (user.id === 'client_b') {
        return [
          {
            id: 'proj_2',
            name: 'Alpha Client Brand Redesign',
            description: 'Comprehensive brand asset overhaul and e-commerce launch.',
            status: 'ONBOARDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }
      return [];
    }

    if (user.role === 'Owner') {
      return this.prisma.project.findMany({
        include: {
          websites: true,
          milestones: { orderBy: { orderIndex: 'asc' } },
          memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.project.findMany({
      where: {
        memberships: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        websites: true,
        milestones: { orderBy: { orderIndex: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectById(projectId: string, user: AuthenticatedUser) {
    if (!process.env.DATABASE_URL) {
      if (user.role === 'Owner') {
        return {
          id: projectId,
          name: projectId === 'proj_1' ? 'Stephen Showcase Website' : `Project ${projectId}`,
          description: 'Client engagement overview and deliverable timeline.',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      if (user.id === 'client_a' && projectId === 'proj_1') {
        return {
          id: 'proj_1',
          name: 'Stephen Showcase Website',
          description: 'Custom headless architecture with responsive dark/light themes.',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      if (user.id === 'client_b' && projectId === 'proj_2') {
        return {
          id: 'proj_2',
          name: 'Alpha Client Brand Redesign',
          description: 'Comprehensive brand asset overhaul and e-commerce launch.',
          status: 'ONBOARDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      throw new NotFoundException('Project not found.');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        memberships: {
          where: user.role === 'Owner' ? undefined : { userId: user.id },
        },
        websites: true,
        milestones: { orderBy: { orderIndex: 'asc' } },
        documents: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (user.role !== 'Owner' && project.memberships.length === 0) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  async getClientOverview(user: AuthenticatedUser) {
    const projects = await this.getProjectsForUser(user);

    if (!projects || projects.length === 0) {
      return {
        hasActiveProject: false,
        message: 'No active project engagement assigned.',
      };
    }

    const activeProject = projects[0];
    const projectId = activeProject.id;

    if (!process.env.DATABASE_URL) {
      return {
        hasActiveProject: true,
        activeProject: {
          id: projectId,
          name: activeProject.name,
          description: activeProject.description,
          status: activeProject.status,
        },
        currentMilestone: {
          title: 'Design System & Wireframes',
          status: 'AWAITING_REVIEW',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        },
        websites: [
          { name: 'Staging Environment', url: 'https://staging.example.com', environment: 'STAGING', status: 'LIVE' },
          { name: 'Production Website', url: 'https://example.com', environment: 'PRODUCTION', status: 'DRAFT' },
        ],
        onboarding: {
          completedSteps: 2,
          totalSteps: 6,
          isKickoffApproved: activeProject.status === 'ACTIVE',
        },
        recentActivity: [
          { id: 'act_1', action: 'Design sign-off requested', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
          { id: 'act_2', action: 'Creative brief document attached', timestamp: new Date(Date.now() - 86400000).toISOString() },
        ],
      };
    }

    const [milestones, websites, onboarding] = await Promise.all([
      this.prisma.milestone.findMany({
        where: { projectId },
        orderBy: { orderIndex: 'asc' },
      }),
      this.prisma.website.findMany({
        where: { projectId },
      }),
      this.onboardingService.getOnboardingProgress(projectId),
    ]);

    const currentMilestone = milestones.find((m) => m.status === 'AWAITING_REVIEW' || m.status === 'IN_PROGRESS') || milestones[0];

    return {
      hasActiveProject: true,
      activeProject: {
        id: activeProject.id,
        name: activeProject.name,
        description: activeProject.description,
        status: activeProject.status,
      },
      currentMilestone,
      websites,
      onboarding,
      milestones,
    };
  }

  async getProjectWorkspace(projectId: string, user: AuthenticatedUser) {
    const project = await this.getProjectById(projectId, user);

    if (!process.env.DATABASE_URL) {
      return {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
        },
        websites: [
          { id: 'w1', name: 'Staging Environment', url: 'https://staging.example.com', environment: 'STAGING', status: 'LIVE' },
          { id: 'w2', name: 'Production Site', url: 'https://example.com', environment: 'PRODUCTION', status: 'DRAFT' },
        ],
        milestones: [
          { id: 'm1', title: 'Kickoff & Discovery', status: 'APPROVED', orderIndex: 0 },
          { id: 'm2', title: 'Design System & Shell', status: 'AWAITING_REVIEW', orderIndex: 1 },
          { id: 'm3', title: 'Feature Development', status: 'PLANNED', orderIndex: 2 },
        ],
        documents: [
          {
            id: 'd1',
            title: 'Project Creative Brief & Specifications',
            driveUrl: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
            category: 'BRIEF',
          },
        ],
        isDesignatedApprover: user.role === 'Owner' || user.id === 'client_a',
      };
    }

    const [websites, milestones, documents, membership] = await Promise.all([
      this.prisma.website.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.milestone.findMany({ where: { projectId }, orderBy: { orderIndex: 'asc' } }),
      this.prisma.driveDocument.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.projectMembership.findFirst({ where: { projectId, userId: user.id } }),
    ]);

    return {
      project,
      websites,
      milestones,
      documents,
      isDesignatedApprover: user.role === 'Owner' || !!membership?.isDesignatedApprover,
    };
  }

  async createProject(dto: CreateProjectDto, ownerId: string) {
    if (!process.env.DATABASE_URL) {
      return {
        id: `proj_${Date.now()}`,
        name: dto.name,
        description: dto.description || null,
        status: 'ONBOARDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create project record
      const project = await tx.project.create({
        data: {
          name: dto.name,
          description: dto.description,
          status: 'ONBOARDING',
        },
      });

      // 2. Assign client membership with designated approver by default
      await tx.projectMembership.create({
        data: {
          projectId: project.id,
          userId: dto.clientId,
          isDesignatedApprover: true,
          isDesignatedBillingContact: true,
        },
      });

      // 3. Create initial websites if provided
      if (dto.initialWebsites && dto.initialWebsites.length > 0) {
        for (const web of dto.initialWebsites) {
          await tx.website.create({
            data: {
              projectId: project.id,
              name: web.name,
              url: web.url,
              environment: (web.environment as any) || 'STAGING',
              status: (web.status as any) || 'DRAFT',
            },
          });
        }
      }

      // 4. Initialize 6 onboarding steps
      await this.onboardingService.initializeSteps(project.id);

      // 5. Initialize default baseline milestones
      const baselineMilestones = [
        { title: 'Project Kickoff & Discovery', description: 'Onboarding questionnaire, requirements alignment, and scope freeze.', orderIndex: 0 },
        { title: 'Design System & Interactive Shell', description: 'Responsive layouts across desktop, tablet, and mobile in both themes.', orderIndex: 1 },
        { title: 'Core Application Development', description: 'Backend service integration, API endpoints, and database workflows.', orderIndex: 2 },
        { title: 'Staging QA & Production Launch', description: 'Full verification checklist, accessibility review, and production handoff.', orderIndex: 3 },
      ];

      for (const m of baselineMilestones) {
        await tx.milestone.create({
          data: {
            projectId: project.id,
            title: m.title,
            description: m.description,
            orderIndex: m.orderIndex,
            status: m.orderIndex === 0 ? 'IN_PROGRESS' : 'PLANNED',
          },
        });
      }

      // 6. Write audit log
      await tx.auditLog.create({
        data: {
          actorId: ownerId,
          action: 'ProjectCreated',
          targetType: 'Project',
          targetId: project.id,
          metadata: {
            name: dto.name,
            assignedClient: dto.clientId,
          },
        },
      });

      return project;
    });
  }

  async updateProject(projectId: string, dto: UpdateProjectDto, ownerId: string) {
    if (!process.env.DATABASE_URL) {
      return { id: projectId, ...dto, updatedAt: new Date().toISOString() };
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status as any,
        kickoffNotes: dto.kickoffNotes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: ownerId,
        action: 'ProjectUpdated',
        targetType: 'Project',
        targetId: projectId,
        metadata: { changes: dto as any },
      },
    });

    return updated;
  }

  async deleteProject(projectId: string, ownerId: string) {
    if (!process.env.DATABASE_URL) {
      return { success: true };
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: ownerId,
        action: 'ProjectDeleted',
        targetType: 'Project',
        targetId: projectId,
      },
    });

    return { success: true };
  }
}

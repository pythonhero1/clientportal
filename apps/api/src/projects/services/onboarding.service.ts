import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateOnboardingStepDto } from '../dto/update-onboarding-step.dto.js';
import { CredentialStatusDto } from '../dto/credential-status.dto.js';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async initializeSteps(projectId: string) {
    if (!process.env.DATABASE_URL) return;

    const stepKeys = [
      'CONTACT_DETAILS',
      'QUESTIONNAIRE',
      'BRAND_ASSETS',
      'CONTENT_UPLOAD',
      'ACCESS_CREDENTIALS',
      'KICKOFF_APPROVAL',
    ];

    for (const key of stepKeys) {
      await this.prisma.onboardingStep.upsert({
        where: {
          projectId_stepKey: {
            projectId,
            stepKey: key as any,
          },
        },
        update: {},
        create: {
          projectId,
          stepKey: key as any,
          status: key === 'CONTACT_DETAILS' ? 'COMPLETED' : 'NOT_STARTED',
        },
      });
    }
  }

  async getOnboardingProgress(projectId: string) {
    if (!process.env.DATABASE_URL) {
      return {
        projectId,
        isKickoffApproved: false,
        steps: [
          { stepKey: 'CONTACT_DETAILS', title: 'Contact & Billing Details', status: 'COMPLETED' },
          { stepKey: 'QUESTIONNAIRE', title: 'Discovery Questionnaire', status: 'IN_PROGRESS' },
          { stepKey: 'BRAND_ASSETS', title: 'Brand Assets & Vectors', status: 'NOT_STARTED' },
          { stepKey: 'CONTENT_UPLOAD', title: 'Website Content & Copy', status: 'NOT_STARTED' },
          { stepKey: 'ACCESS_CREDENTIALS', title: 'Platform Access & Credentials', status: 'NOT_STARTED' },
          { stepKey: 'KICKOFF_APPROVAL', title: 'Kickoff Scope Approval', status: 'NOT_STARTED' },
        ],
      };
    }

    const steps = await this.prisma.onboardingStep.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true, kickoffApprovedAt: true },
    });

    return {
      projectId,
      isKickoffApproved: project?.status === 'ACTIVE' || !!project?.kickoffApprovedAt,
      steps,
    };
  }

  async updateStep(projectId: string, stepKey: string, dto: UpdateOnboardingStepDto, userId?: string) {
    if (!process.env.DATABASE_URL) {
      return {
        projectId,
        stepKey,
        status: dto.status,
        metadata: dto.metadata,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.prisma.onboardingStep.upsert({
      where: {
        projectId_stepKey: {
          projectId,
          stepKey: stepKey as any,
        },
      },
      update: {
        status: dto.status as any,
        metadata: dto.metadata,
        completedAt: dto.status === 'COMPLETED' ? new Date() : null,
        completedById: dto.status === 'COMPLETED' ? userId : null,
      },
      create: {
        projectId,
        stepKey: stepKey as any,
        status: dto.status as any,
        metadata: dto.metadata,
        completedAt: dto.status === 'COMPLETED' ? new Date() : null,
        completedById: dto.status === 'COMPLETED' ? userId : null,
      },
    });
  }

  async saveCredentialStatus(projectId: string, dto: CredentialStatusDto, _userId?: string) {
    // Explicit safety assertion: reject any payload containing password strings or tokens
    const rawDto = dto as any;
    if (rawDto.password || rawDto.secret || rawDto.token) {
      throw new BadRequestException('Security violation: passwords or secret tokens must never be submitted.');
    }

    if (!process.env.DATABASE_URL) {
      return {
        id: `cred_${Date.now()}`,
        projectId,
        platformName: dto.platformName,
        method: dto.method,
        status: dto.status || 'INVITATION_SENT',
        instructions: dto.instructions || null,
        createdAt: new Date().toISOString(),
      };
    }

    // Record request/status and update Step 5
    const cred = await this.prisma.credentialAccessRequest.create({
      data: {
        projectId,
        platformName: dto.platformName,
        method: dto.method as any,
        status: (dto.status as any) || 'INVITATION_SENT',
        instructions: dto.instructions,
      },
    });

    await this.prisma.onboardingStep.upsert({
      where: {
        projectId_stepKey: {
          projectId,
          stepKey: 'ACCESS_CREDENTIALS',
        },
      },
      update: {
        status: 'AWAITING_REVIEW',
        metadata: {
          lastPlatform: dto.platformName,
          lastMethod: dto.method,
          updatedAt: new Date().toISOString(),
        },
      },
      create: {
        projectId,
        stepKey: 'ACCESS_CREDENTIALS',
        status: 'AWAITING_REVIEW',
        metadata: {
          lastPlatform: dto.platformName,
          lastMethod: dto.method,
        },
      },
    });

    return cred;
  }

  async approveKickoff(projectId: string, ownerId: string, notes?: string) {
    if (!process.env.DATABASE_URL) {
      return {
        projectId,
        status: 'ACTIVE',
        kickoffApprovedAt: new Date().toISOString(),
        kickoffApprovedById: ownerId,
        kickoffNotes: notes || 'Kickoff confirmed by Stephen.',
      };
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Project status to ACTIVE
      const project = await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'ACTIVE',
          kickoffApprovedAt: new Date(),
          kickoffApprovedById: ownerId,
          kickoffNotes: notes,
        },
      });

      // 2. Mark Step 6 (KICKOFF_APPROVAL) as COMPLETED
      await tx.onboardingStep.upsert({
        where: {
          projectId_stepKey: {
            projectId,
            stepKey: 'KICKOFF_APPROVAL',
          },
        },
        update: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: ownerId,
        },
        create: {
          projectId,
          stepKey: 'KICKOFF_APPROVAL',
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: ownerId,
        },
      });

      // 3. Write immutable audit log
      await tx.auditLog.create({
        data: {
          actorId: ownerId,
          action: 'KickoffApproved',
          targetType: 'Project',
          targetId: projectId,
          metadata: {
            notes: notes || 'Owner confirmed project onboarding kickoff.',
          },
        },
      });

      return project;
    });
  }
}

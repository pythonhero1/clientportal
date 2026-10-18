import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SaveQuestionnaireDraftDto } from '../dto/save-questionnaire-draft.dto.js';
import { SubmitQuestionnaireDto } from '../dto/submit-questionnaire.dto.js';

@Injectable()
export class QuestionnaireService {
  constructor(private prisma: PrismaService) {}

  async getQuestionnaire(projectId: string) {
    if (!process.env.DATABASE_URL) {
      return {
        projectId,
        isDraft: true,
        data: {
          businessName: 'Oderinde Digital Solutions',
          websiteGoals: 'Modernize online client experience and portfolio showcase.',
          targetAudience: 'Global enterprises and design-conscious founders.',
          primaryColorPreference: '#3B82F6',
          hasExistingBrandGuidelines: true,
        },
        lastSavedAt: new Date().toISOString(),
        submittedAt: null,
      };
    }

    const response = await this.prisma.questionnaireResponse.findUnique({
      where: { projectId },
    });

    if (!response) {
      return {
        projectId,
        isDraft: true,
        data: {},
        lastSavedAt: new Date().toISOString(),
        submittedAt: null,
      };
    }

    return {
      projectId: response.projectId,
      isDraft: response.isDraft,
      data: response.data,
      lastSavedAt: response.lastSavedAt.toISOString(),
      submittedAt: response.submittedAt ? response.submittedAt.toISOString() : null,
    };
  }

  async saveDraft(projectId: string, dto: SaveQuestionnaireDraftDto, clientId?: string) {
    if (!process.env.DATABASE_URL) {
      return {
        status: 'SAVED',
        projectId,
        lastSavedAt: new Date().toISOString(),
      };
    }

    const response = await this.prisma.questionnaireResponse.upsert({
      where: { projectId },
      update: {
        data: dto.responses,
        isDraft: true,
        lastSavedAt: new Date(),
        clientId: clientId || undefined,
      },
      create: {
        projectId,
        data: dto.responses,
        isDraft: true,
        lastSavedAt: new Date(),
        clientId,
      },
    });

    // Mark Step 2 as IN_PROGRESS
    await this.prisma.onboardingStep.upsert({
      where: {
        projectId_stepKey: {
          projectId,
          stepKey: 'QUESTIONNAIRE',
        },
      },
      update: {
        status: 'IN_PROGRESS',
      },
      create: {
        projectId,
        stepKey: 'QUESTIONNAIRE',
        status: 'IN_PROGRESS',
      },
    });

    return {
      status: 'SAVED',
      projectId: response.projectId,
      lastSavedAt: response.lastSavedAt.toISOString(),
    };
  }

  async submitQuestionnaire(projectId: string, dto: SubmitQuestionnaireDto, clientId?: string) {
    if (!dto.responses || Object.keys(dto.responses).length === 0) {
      throw new BadRequestException('Questionnaire responses cannot be empty upon submission.');
    }

    if (!process.env.DATABASE_URL) {
      return {
        status: 'SUBMITTED',
        projectId,
        submittedAt: new Date().toISOString(),
      };
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Lock and mark questionnaire as submitted
      const response = await tx.questionnaireResponse.upsert({
        where: { projectId },
        update: {
          data: dto.responses,
          isDraft: false,
          submittedAt: new Date(),
          lastSavedAt: new Date(),
          clientId: clientId || undefined,
        },
        create: {
          projectId,
          data: dto.responses,
          isDraft: false,
          submittedAt: new Date(),
          lastSavedAt: new Date(),
          clientId,
        },
      });

      // 2. Mark Step 2 (QUESTIONNAIRE) as COMPLETED
      await tx.onboardingStep.upsert({
        where: {
          projectId_stepKey: {
            projectId,
            stepKey: 'QUESTIONNAIRE',
          },
        },
        update: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: clientId,
        },
        create: {
          projectId,
          stepKey: 'QUESTIONNAIRE',
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: clientId,
        },
      });

      return {
        status: 'SUBMITTED',
        projectId: response.projectId,
        submittedAt: response.submittedAt!.toISOString(),
      };
    });
  }
}

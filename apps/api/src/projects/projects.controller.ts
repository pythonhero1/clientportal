import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { WebsitesService } from './services/websites.service.js';
import { MilestonesService } from './services/milestones.service.js';
import { DocumentsService } from './services/documents.service.js';
import { OnboardingService } from './services/onboarding.service.js';
import { QuestionnaireService } from './services/questionnaire.service.js';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard.js';
import { AccountStatusGuard } from '../auth/guards/account-status.guard.js';
import { ProjectAccessGuard } from '../auth/guards/project-access.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { SaveQuestionnaireDraftDto } from './dto/save-questionnaire-draft.dto.js';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto.js';
import { UpdateOnboardingStepDto } from './dto/update-onboarding-step.dto.js';
import { CredentialStatusDto } from './dto/credential-status.dto.js';

@Controller()
@UseGuards(ClerkAuthGuard, AccountStatusGuard)
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private websitesService: WebsitesService,
    private milestonesService: MilestonesService,
    private documentsService: DocumentsService,
    private onboardingService: OnboardingService,
    private questionnaireService: QuestionnaireService,
  ) {}

  @Get('client/overview')
  async getClientOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.getClientOverview(user);
  }

  @Get('projects')
  async getProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.getProjectsForUser(user);
  }

  @Get('projects/:projectId')
  @UseGuards(ProjectAccessGuard)
  async getProjectById(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.getProjectById(projectId, user);
  }

  @Get('projects/:projectId/workspace')
  @UseGuards(ProjectAccessGuard)
  async getProjectWorkspace(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.getProjectWorkspace(projectId, user);
  }

  @Get('projects/:projectId/websites')
  @UseGuards(ProjectAccessGuard)
  async getWebsites(@Param('projectId') projectId: string) {
    return this.websitesService.getWebsitesForProject(projectId);
  }

  @Get('projects/:projectId/milestones')
  @UseGuards(ProjectAccessGuard)
  async getMilestones(@Param('projectId') projectId: string) {
    return this.milestonesService.getMilestonesForProject(projectId);
  }

  @Post('projects/:projectId/milestones/:milestoneId/approve')
  @UseGuards(ProjectAccessGuard)
  async approveMilestone(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.milestonesService.approveMilestone(projectId, milestoneId, user);
  }

  @Get('projects/:projectId/documents')
  @UseGuards(ProjectAccessGuard)
  async getDocuments(@Param('projectId') projectId: string) {
    return this.documentsService.getDocumentsForProject(projectId);
  }

  @Get('projects/:projectId/onboarding')
  @UseGuards(ProjectAccessGuard)
  async getOnboardingProgress(@Param('projectId') projectId: string) {
    return this.onboardingService.getOnboardingProgress(projectId);
  }

  @Patch('projects/:projectId/onboarding/steps/:stepKey')
  @UseGuards(ProjectAccessGuard)
  async updateOnboardingStep(
    @Param('projectId') projectId: string,
    @Param('stepKey') stepKey: string,
    @Body() dto: UpdateOnboardingStepDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.onboardingService.updateStep(projectId, stepKey, dto, user.id);
  }

  @Get('projects/:projectId/onboarding/questionnaire')
  @UseGuards(ProjectAccessGuard)
  async getQuestionnaire(@Param('projectId') projectId: string) {
    return this.questionnaireService.getQuestionnaire(projectId);
  }

  @Put('projects/:projectId/onboarding/questionnaire/draft')
  @UseGuards(ProjectAccessGuard)
  async saveQuestionnaireDraft(
    @Param('projectId') projectId: string,
    @Body() dto: SaveQuestionnaireDraftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionnaireService.saveDraft(projectId, dto, user.id);
  }

  @Post('projects/:projectId/onboarding/questionnaire/submit')
  @UseGuards(ProjectAccessGuard)
  async submitQuestionnaire(
    @Param('projectId') projectId: string,
    @Body() dto: SubmitQuestionnaireDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionnaireService.submitQuestionnaire(projectId, dto, user.id);
  }

  @Post('projects/:projectId/onboarding/credentials/confirm-shared')
  @UseGuards(ProjectAccessGuard)
  async confirmCredentialShared(
    @Param('projectId') projectId: string,
    @Body() dto: CredentialStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.onboardingService.saveCredentialStatus(projectId, dto, user.id);
  }
}

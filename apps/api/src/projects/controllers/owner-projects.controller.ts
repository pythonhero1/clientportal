import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from '../projects.service.js';
import { WebsitesService } from '../services/websites.service.js';
import { MilestonesService } from '../services/milestones.service.js';
import { DocumentsService } from '../services/documents.service.js';
import { OnboardingService } from '../services/onboarding.service.js';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { OwnerMfaGuard } from '../../auth/guards/owner-mfa.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { CreateProjectDto } from '../dto/create-project.dto.js';
import { UpdateProjectDto } from '../dto/update-project.dto.js';
import { CreateWebsiteDto } from '../dto/create-website.dto.js';
import { UpdateWebsiteDto } from '../dto/update-website.dto.js';
import { CreateMilestoneDto } from '../dto/create-milestone.dto.js';
import { UpdateMilestoneDto } from '../dto/update-milestone.dto.js';
import { CreateDriveDocumentDto } from '../dto/create-drive-document.dto.js';

@Controller('admin/projects')
@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)
@Roles('Owner')
export class OwnerProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private websitesService: WebsitesService,
    private milestonesService: MilestonesService,
    private documentsService: DocumentsService,
    private onboardingService: OnboardingService,
  ) {}

  @Get()
  async getAllProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.getProjectsForUser(user);
  }

  @Post()
  async createProject(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.createProject(dto, user.id);
  }

  @Patch(':projectId')
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.updateProject(projectId, dto, user.id);
  }

  @Delete(':projectId')
  async deleteProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.deleteProject(projectId, user.id);
  }

  // Website Management
  @Post(':projectId/websites')
  async addWebsite(
    @Param('projectId') projectId: string,
    @Body() dto: CreateWebsiteDto,
  ) {
    return this.websitesService.createWebsite(projectId, dto);
  }

  @Patch(':projectId/websites/:websiteId')
  async updateWebsite(
    @Param('projectId') projectId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: UpdateWebsiteDto,
  ) {
    return this.websitesService.updateWebsite(projectId, websiteId, dto);
  }

  @Delete(':projectId/websites/:websiteId')
  async deleteWebsite(
    @Param('projectId') projectId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.websitesService.deleteWebsite(projectId, websiteId);
  }

  // Milestone Management
  @Post(':projectId/milestones')
  async addMilestone(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.milestonesService.createMilestone(projectId, dto);
  }

  @Patch(':projectId/milestones/:milestoneId')
  async updateMilestone(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.milestonesService.updateMilestone(projectId, milestoneId, dto);
  }

  @Delete(':projectId/milestones/:milestoneId')
  async deleteMilestone(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.milestonesService.deleteMilestone(projectId, milestoneId);
  }

  // Drive Document Management
  @Post(':projectId/documents')
  async addDocument(
    @Param('projectId') projectId: string,
    @Body() dto: CreateDriveDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.createDocument(projectId, dto, user.id);
  }

  @Delete(':projectId/documents/:documentId')
  async deleteDocument(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentsService.deleteDocument(projectId, documentId);
  }

  // Onboarding Kickoff Approval
  @Post(':projectId/kickoff/approve')
  async approveKickoff(
    @Param('projectId') projectId: string,
    @Body('notes') notes: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.onboardingService.approveKickoff(projectId, user.id, notes);
  }
}

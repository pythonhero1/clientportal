import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller.js';
import { OwnerProjectsController } from './controllers/owner-projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { WebsitesService } from './services/websites.service.js';
import { MilestonesService } from './services/milestones.service.js';
import { DocumentsService } from './services/documents.service.js';
import { OnboardingService } from './services/onboarding.service.js';
import { QuestionnaireService } from './services/questionnaire.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController, OwnerProjectsController],
  providers: [
    ProjectsService,
    WebsitesService,
    MilestonesService,
    DocumentsService,
    OnboardingService,
    QuestionnaireService,
  ],
  exports: [
    ProjectsService,
    WebsitesService,
    MilestonesService,
    DocumentsService,
    OnboardingService,
    QuestionnaireService,
  ],
})
export class ProjectsModule {}

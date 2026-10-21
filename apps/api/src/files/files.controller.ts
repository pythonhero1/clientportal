import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FilesService } from './services/files.service.js';
import { FileVersionsService } from './services/file-versions.service.js';
import { FileReviewsService } from './services/file-reviews.service.js';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard.js';
import { AccountStatusGuard } from '../auth/guards/account-status.guard.js';
import { ProjectAccessGuard } from '../auth/guards/project-access.guard.js';
import { FileAccessGuard } from './guards/file-access.guard.js';
import { DesignatedApproverGuard } from './guards/designated-approver.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { RequestUploadDto } from './dto/request-upload.dto.js';
import { CompleteUploadDto } from './dto/complete-upload.dto.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { ApproveVersionDto } from './dto/approve-version.dto.js';
import { FileCategory } from '@prisma/client';

@Controller('projects/:projectId/files')
@UseGuards(ClerkAuthGuard, AccountStatusGuard, ProjectAccessGuard)
export class FilesController {
  constructor(
    private filesService: FilesService,
    private fileVersionsService: FileVersionsService,
    private fileReviewsService: FileReviewsService,
  ) {}

  @Get()
  async listFiles(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: FileCategory,
  ) {
    return this.filesService.listFiles(projectId, user, category);
  }

  @Get(':fileId')
  @UseGuards(FileAccessGuard)
  async getFileById(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.getFileById(projectId, fileId, user);
  }

  @Post('upload-initiate')
  async initiateUpload(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestUploadDto,
  ) {
    return this.filesService.initiateUpload(projectId, user, dto);
  }

  @Post('upload-complete')
  async completeUpload(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.filesService.completeUpload(projectId, user, dto);
  }

  @Get(':fileId/versions')
  @UseGuards(FileAccessGuard)
  async listVersions(@Param('fileId') fileId: string) {
    return this.fileVersionsService.listVersions(fileId);
  }

  @Get(':fileId/versions/:versionId/download')
  @UseGuards(FileAccessGuard)
  async getDownloadUrl(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.filesService.getDownloadUrl(projectId, fileId, versionId, user);
  }

  @Post(':fileId/versions/:versionId/comments')
  @UseGuards(FileAccessGuard)
  async addComment(
    @Param('fileId') fileId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.fileReviewsService.addComment(fileId, versionId, user, dto.content);
  }

  @Post(':fileId/versions/:versionId/approve')
  @UseGuards(FileAccessGuard, DesignatedApproverGuard)
  async approveVersion(
    @Param('fileId') fileId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveVersionDto,
  ) {
    return this.fileReviewsService.approveVersion(fileId, versionId, user, dto.approvalNotes);
  }
}

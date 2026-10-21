import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileLifecycleService } from '../services/file-lifecycle.service.js';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { OwnerMfaGuard } from '../../auth/guards/owner-mfa.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { LifecycleActionDto } from '../dto/lifecycle-action.dto.js';

@Controller('admin/files')
@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)
@Roles('Owner')
export class OwnerFilesController {
  constructor(private fileLifecycleService: FileLifecycleService) {}

  @Get('lifecycle')
  async getLifecycleSummary(@Query('projectId') projectId?: string) {
    return this.fileLifecycleService.getLifecycleSummary(projectId);
  }

  @Post(':fileId/archive')
  async archiveFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LifecycleActionDto,
  ) {
    return this.fileLifecycleService.archiveFile(fileId, user, dto?.reason);
  }

  @Post(':fileId/unarchive')
  async unarchiveFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.fileLifecycleService.unarchiveFile(fileId, user);
  }

  @Post(':fileId/soft-delete')
  async softDeleteFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LifecycleActionDto,
  ) {
    return this.fileLifecycleService.softDeleteFile(fileId, user, dto?.reason);
  }

  @Post(':fileId/restore')
  async restoreFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.fileLifecycleService.restoreFile(fileId, user);
  }

  @Delete(':fileId/permanent')
  async permanentDeleteFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LifecycleActionDto,
  ) {
    return this.fileLifecycleService.permanentDeleteFile(fileId, user, dto?.confirmationCode);
  }
}

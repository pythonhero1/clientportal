import { Module } from '@nestjs/common';
import { StorageService } from './services/storage.service.js';
import { QuarantineService } from './services/quarantine.service.js';
import { FilesService } from './services/files.service.js';
import { FileVersionsService } from './services/file-versions.service.js';
import { FileReviewsService } from './services/file-reviews.service.js';
import { FileLifecycleService } from './services/file-lifecycle.service.js';
import { FileAccessGuard } from './guards/file-access.guard.js';
import { DesignatedApproverGuard } from './guards/designated-approver.guard.js';
import { FilesController } from './files.controller.js';
import { OwnerFilesController } from './controllers/owner-files.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [FilesController, OwnerFilesController],
  providers: [
    StorageService,
    QuarantineService,
    FilesService,
    FileVersionsService,
    FileReviewsService,
    FileLifecycleService,
    FileAccessGuard,
    DesignatedApproverGuard,
  ],
  exports: [
    FilesService,
    StorageService,
    QuarantineService,
    FileLifecycleService,
  ],
})
export class FilesModule {}

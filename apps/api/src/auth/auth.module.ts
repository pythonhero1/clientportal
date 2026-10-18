import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { ClerkAuthGuard } from './guards/clerk-auth.guard.js';
import { AccountStatusGuard } from './guards/account-status.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { OwnerMfaGuard } from './guards/owner-mfa.guard.js';
import { ProjectAccessGuard } from './guards/project-access.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    ClerkAuthGuard,
    AccountStatusGuard,
    RolesGuard,
    OwnerMfaGuard,
    ProjectAccessGuard,
  ],
  exports: [
    ClerkAuthGuard,
    AccountStatusGuard,
    RolesGuard,
    OwnerMfaGuard,
    ProjectAccessGuard,
  ],
})
export class AuthModule {}

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { OwnerMfaGuard } from '../auth/guards/owner-mfa.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

class CreateInvitationDto {
  email!: string;
  projectId?: string;
  isDesignatedBillingContact?: boolean;
  isDesignatedApprover?: boolean;
}

@Controller('admin')
@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)
@Roles('Owner')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('users/pending')
  async getPendingUsers() {
    return this.usersService.getPendingUsers();
  }

  @Get('users/clients')
  async getClients() {
    return this.usersService.getClients();
  }

  @Post('users/:userId/activate')
  @HttpCode(HttpStatus.OK)
  async activateUser(
    @Param('userId') userId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.activateUser(userId, actor.id);
  }

  @Post('users/:userId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectUser(
    @Param('userId') userId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.rejectUser(userId, actor.id);
  }

  @Post('invitations')
  async createInvitation(
    @Body() body: CreateInvitationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.createInvitation(body, actor.id);
  }
}

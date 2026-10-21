import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { OwnerMfaGuard } from '../../auth/guards/owner-mfa.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { ConversationsService } from '../services/conversations.service.js';
import { CreateConversationDto } from '../dto/create-conversation.dto.js';
import { ManageMemberDto } from '../dto/manage-member.dto.js';

@Controller('admin/conversations')
@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)
@Roles('Owner')
export class OwnerMessagesController {
  constructor(private conversationsService: ConversationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.createConversation(dto, user);
  }

  @Patch(':id/members')
  @HttpCode(HttpStatus.OK)
  async manageMember(
    @Param('id') id: string,
    @Body() dto: ManageMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.manageMember(
      id,
      dto.action,
      dto.userId,
      user,
    );
  }
}

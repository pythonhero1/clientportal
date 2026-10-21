import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { OwnerMfaGuard } from '../../auth/guards/owner-mfa.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { TicketsService } from '../services/tickets.service.js';
import { HelpService } from '../services/help.service.js';
import { TriageTicketDto } from '../dto/triage-ticket.dto.js';
import { SendTicketMessageDto } from '../dto/send-ticket-message.dto.js';
import { CreateHelpCategoryDto } from '../dto/create-help-category.dto.js';
import { CreateHelpArticleDto } from '../dto/create-help-article.dto.js';
import { UpdateHelpArticleDto } from '../dto/update-help-article.dto.js';
import { TicketPriority, TicketStatus } from '@prisma/client';

@Controller('admin/support')
@UseGuards(ClerkAuthGuard, RolesGuard, OwnerMfaGuard)
@Roles('Owner')
export class OwnerSupportController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly helpService: HelpService,
  ) {}

  @Get('tickets')
  async getQueue(
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('clientId') clientId?: string,
  ) {
    return this.ticketsService.getOwnerQueue({ status, priority, clientId });
  }

  @Patch('tickets/:ticketId/triage')
  async triageTicket(
    @Param('ticketId') ticketId: string,
    @Body() body: TriageTicketDto,
  ) {
    return this.ticketsService.triageTicket(ticketId, body);
  }

  @Post('tickets/:ticketId/messages')
  async addReply(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SendTicketMessageDto,
  ) {
    return this.ticketsService.addMessage(ticketId, user, body);
  }

  @Get('help/categories')
  async getCategories() {
    return this.helpService.getCategories(true);
  }

  @Post('help/categories')
  async createCategory(@Body() body: CreateHelpCategoryDto) {
    return this.helpService.createCategory(body);
  }

  @Get('help/articles')
  async getArticles(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.helpService.getArticles(categoryId, search, true);
  }

  @Post('help/articles')
  async createArticle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateHelpArticleDto,
  ) {
    return this.helpService.createArticle(body, user.id);
  }

  @Patch('help/articles/:id')
  async updateArticle(
    @Param('id') id: string,
    @Body() body: UpdateHelpArticleDto,
  ) {
    return this.helpService.updateArticle(id, body);
  }

  @Delete('help/articles/:id')
  async deleteArticle(@Param('id') id: string) {
    return this.helpService.deleteArticle(id);
  }
}

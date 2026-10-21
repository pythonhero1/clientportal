import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard.js';
import { AccountStatusGuard } from '../../auth/guards/account-status.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator.js';
import { TicketsService } from '../services/tickets.service.js';
import { HelpService } from '../services/help.service.js';
import { TicketAccessGuard } from '../guards/ticket-access.guard.js';
import { CreateTicketDto } from '../dto/create-ticket.dto.js';
import { SendTicketMessageDto } from '../dto/send-ticket-message.dto.js';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto.js';
import { TicketStatus } from '@prisma/client';

@Controller('support')
@UseGuards(ClerkAuthGuard, AccountStatusGuard)
export class SupportController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly helpService: HelpService,
  ) {}

  @Get('tickets')
  async getMyTickets(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: TicketStatus,
  ) {
    return this.ticketsService.getClientTickets(user.id, status);
  }

  @Post('tickets')
  async createTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateTicketDto,
  ) {
    return this.ticketsService.createTicket(user.id, body);
  }

  @Get('tickets/:ticketId')
  @UseGuards(TicketAccessGuard)
  async getTicketDetails(@Param('ticketId') ticketId: string) {
    return this.ticketsService.getTicketDetails(ticketId);
  }

  @Post('tickets/:ticketId/messages')
  @UseGuards(TicketAccessGuard)
  async addMessage(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SendTicketMessageDto,
  ) {
    return this.ticketsService.addMessage(ticketId, user, body);
  }

  @Patch('tickets/:ticketId/status')
  @UseGuards(TicketAccessGuard)
  async updateStatus(
    @Param('ticketId') ticketId: string,
    @Body() body: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.updateClientStatus(ticketId, body.status);
  }

  @Get('help/categories')
  async getHelpCategories() {
    return this.helpService.getCategories(false);
  }

  @Get('help/articles')
  async getHelpArticles(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.helpService.getArticles(categoryId, search, false);
  }

  @Get('help/articles/:slug')
  async getHelpArticleBySlug(@Param('slug') slug: string) {
    return this.helpService.getArticleBySlug(slug, false);
  }
}

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard.js';
import { AccountStatusGuard } from '../auth/guards/account-status.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { SupportService } from './services/support.service.js';
import { CreateTicketDto, ReplyTicketDto } from './dto/support.dto.js';

@Controller('support')
@UseGuards(ClerkAuthGuard, AccountStatusGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  async listTickets(@CurrentUser() user: AuthenticatedUser) {
    return this.supportService.listClientTickets(user.id);
  }

  @Get('tickets/:id')
  async getTicketDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.supportService.getClientTicketDetail(id, user.id);
  }

  @Post('tickets')
  async createTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTicketDto,
  ) {
    return this.supportService.createTicket(user.id, dto);
  }

  @Post('tickets/:id/reply')
  async replyTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
  ) {
    return this.supportService.addReply(id, user.id, dto, user.role === 'Owner');
  }

  @Get('articles')
  async listArticles() {
    return this.supportService.listHelpArticles();
  }
}

import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TicketPriority, TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  subject!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}

export class ReplyTicketDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status!: TicketStatus;
}

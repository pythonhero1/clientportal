import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketPriority, TicketStatus } from '@prisma/client';

export class TriageTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

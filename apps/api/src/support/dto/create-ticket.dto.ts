import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketPriority } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority = TicketPriority.NORMAL;

  @IsOptional()
  @IsString()
  projectId?: string;
}

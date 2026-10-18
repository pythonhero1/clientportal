import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsDateString } from 'class-validator';

export enum MilestoneStatusDto {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_REVIEW = 'AWAITING_REVIEW',
  APPROVED = 'APPROVED',
}

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number = 0;

  @IsEnum(MilestoneStatusDto)
  @IsOptional()
  status?: MilestoneStatusDto = MilestoneStatusDto.PLANNED;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

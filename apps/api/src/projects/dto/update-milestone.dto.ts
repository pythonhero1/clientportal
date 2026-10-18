import { IsString, IsOptional, IsInt, IsEnum, IsDateString } from 'class-validator';
import { MilestoneStatusDto } from './create-milestone.dto.js';

export class UpdateMilestoneDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @IsEnum(MilestoneStatusDto)
  @IsOptional()
  status?: MilestoneStatusDto;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

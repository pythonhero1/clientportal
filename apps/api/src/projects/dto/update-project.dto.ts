import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ProjectStatusDto {
  ONBOARDING = 'ONBOARDING',
  ACTIVE = 'ACTIVE',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProjectStatusDto)
  @IsOptional()
  status?: ProjectStatusDto;

  @IsString()
  @IsOptional()
  kickoffNotes?: string;
}

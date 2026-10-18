import { IsEnum, IsOptional, IsObject } from 'class-validator';

export enum StepStatusDto {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  AWAITING_REVIEW = 'AWAITING_REVIEW',
}

export class UpdateOnboardingStepDto {
  @IsEnum(StepStatusDto)
  status!: StepStatusDto;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

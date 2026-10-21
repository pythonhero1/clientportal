import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  inAppDeliverables?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppInvoices?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppMilestones?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppMeetings?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppSupport?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushDeliverables?: boolean;

  @IsOptional()
  @IsBoolean()
  pushMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  pushInvoices?: boolean;

  @IsOptional()
  @IsBoolean()
  pushMilestones?: boolean;

  @IsOptional()
  @IsBoolean()
  pushMeetings?: boolean;

  @IsOptional()
  @IsBoolean()
  pushSupport?: boolean;
}

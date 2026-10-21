import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class PushSubscriptionDto {
  @IsString()
  endpoint!: string;

  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class NotificationPreferencesDto {
  @IsOptional()
  inAppDeliverables?: boolean;

  @IsOptional()
  inAppMessages?: boolean;

  @IsOptional()
  inAppInvoices?: boolean;

  @IsOptional()
  inAppMilestones?: boolean;

  @IsOptional()
  inAppMeetings?: boolean;

  @IsOptional()
  inAppSupport?: boolean;

  @IsOptional()
  pushEnabled?: boolean;

  @IsOptional()
  pushDeliverables?: boolean;

  @IsOptional()
  pushMessages?: boolean;

  @IsOptional()
  pushInvoices?: boolean;

  @IsOptional()
  pushMilestones?: boolean;

  @IsOptional()
  pushMeetings?: boolean;

  @IsOptional()
  pushSupport?: boolean;
}

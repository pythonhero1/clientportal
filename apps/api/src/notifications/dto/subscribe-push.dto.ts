import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class PushSubscriptionKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class SubscribePushDto {
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @IsObject()
  @IsNotEmpty()
  keys!: PushSubscriptionKeysDto;

  @IsString()
  @IsOptional()
  userAgent?: string;
}

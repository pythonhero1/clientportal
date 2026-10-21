import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, ArrayMinSize } from 'class-validator';
import { ConversationType } from '@prisma/client';

export class CreateConversationDto {
  @IsEnum(ConversationType)
  @IsNotEmpty()
  type!: ConversationType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  participantUserIds!: string[];
}

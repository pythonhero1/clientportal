import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileVersionIds?: string[];
}

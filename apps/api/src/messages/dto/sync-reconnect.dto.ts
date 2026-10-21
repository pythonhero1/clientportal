import { IsString, IsNotEmpty, IsISO8601 } from 'class-validator';

export class SyncReconnectDto {
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsISO8601()
  @IsNotEmpty()
  since!: string;
}

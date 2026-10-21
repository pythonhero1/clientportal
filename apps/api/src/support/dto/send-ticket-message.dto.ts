import { IsNotEmpty, IsString } from 'class-validator';

export class SendTicketMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}

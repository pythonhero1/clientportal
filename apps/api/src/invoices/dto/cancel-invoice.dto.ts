import { IsNotEmpty, IsString } from 'class-validator';

export class CancelInvoiceDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

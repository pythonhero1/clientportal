import { IsOptional, IsString } from 'class-validator';

export class IssueInvoiceDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

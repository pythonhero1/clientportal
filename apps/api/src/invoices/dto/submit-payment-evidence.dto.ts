import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitPaymentEvidenceDto {
  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsOptional()
  evidenceNote?: string;
}

import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ApproveVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  approvalNotes?: string;
}

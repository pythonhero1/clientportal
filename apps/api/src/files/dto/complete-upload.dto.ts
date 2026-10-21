import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsString()
  @IsNotEmpty()
  versionId: string;

  @IsString()
  @IsNotEmpty()
  quarantineKey: string;

  @IsOptional()
  @IsString()
  checksumSha256?: string;
}

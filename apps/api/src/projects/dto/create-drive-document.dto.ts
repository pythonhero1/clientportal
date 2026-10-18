import { IsString, IsNotEmpty, IsOptional, IsEnum, Matches } from 'class-validator';

export enum DriveDocumentCategoryDto {
  BRIEF = 'BRIEF',
  SPECIFICATION = 'SPECIFICATION',
  BRAND_GUIDELINES = 'BRAND_GUIDELINES',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

export class CreateDriveDocumentDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^https:\/\/(drive|docs)\.google\.com\/.+/, {
    message: 'driveUrl must be a secure Google Drive or Google Docs URL starting with https://drive.google.com/ or https://docs.google.com/',
  })
  driveUrl!: string;

  @IsEnum(DriveDocumentCategoryDto)
  @IsOptional()
  category?: DriveDocumentCategoryDto = DriveDocumentCategoryDto.OTHER;

  @IsString()
  @IsOptional()
  sharedStatusNote?: string;
}

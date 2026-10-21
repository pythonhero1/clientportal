import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Max, Min, IsBoolean } from 'class-validator';
import { FileCategory, FileVisibility } from '@prisma/client';
import { MAX_FILE_SIZE_BYTES } from '../services/quarantine.service.js';

export class RequestUploadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(FileCategory)
  category: FileCategory;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileExtension: string;

  @IsNumber()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES, {
    message: `File size must not exceed 500 MB (${MAX_FILE_SIZE_BYTES} bytes).`,
  })
  byteSize: number;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsOptional()
  @IsEnum(FileVisibility)
  visibility?: FileVisibility = FileVisibility.SHARED;

  @IsOptional()
  @IsBoolean()
  isNewVersion?: boolean = false;

  @IsOptional()
  @IsString()
  existingFileId?: string;
}

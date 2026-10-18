import { IsString, IsNotEmpty, IsUrl, IsEnum, IsOptional } from 'class-validator';

export enum WebsiteEnvironmentDto {
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
}

export enum WebsiteStatusDto {
  DRAFT = 'DRAFT',
  LIVE = 'LIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export class CreateWebsiteDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  url!: string;

  @IsEnum(WebsiteEnvironmentDto)
  @IsOptional()
  environment?: WebsiteEnvironmentDto = WebsiteEnvironmentDto.STAGING;

  @IsEnum(WebsiteStatusDto)
  @IsOptional()
  status?: WebsiteStatusDto = WebsiteStatusDto.DRAFT;
}

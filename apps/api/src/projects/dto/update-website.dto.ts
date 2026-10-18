import { IsString, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { WebsiteEnvironmentDto, WebsiteStatusDto } from './create-website.dto.js';

export class UpdateWebsiteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  url?: string;

  @IsEnum(WebsiteEnvironmentDto)
  @IsOptional()
  environment?: WebsiteEnvironmentDto;

  @IsEnum(WebsiteStatusDto)
  @IsOptional()
  status?: WebsiteStatusDto;
}

import { IsString, IsOptional } from 'class-validator';

export class LifecycleActionDto {
  @IsOptional()
  @IsString()
  reason?: string;

  /**
   * Confirmation string required for permanent deletion (e.g. project or file name)
   */
  @IsOptional()
  @IsString()
  confirmationCode?: string;
}

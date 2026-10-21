import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHelpCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}

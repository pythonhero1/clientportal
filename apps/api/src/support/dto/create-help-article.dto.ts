import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHelpArticleDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = true;

  @IsOptional()
  @IsInt()
  orderIndex?: number = 0;
}

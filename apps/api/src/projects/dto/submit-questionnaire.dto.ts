import { IsObject, IsNotEmpty } from 'class-validator';

export class SubmitQuestionnaireDto {
  @IsObject()
  @IsNotEmpty()
  responses!: Record<string, any>;
}

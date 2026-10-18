import { IsObject, IsNotEmpty } from 'class-validator';

export class SaveQuestionnaireDraftDto {
  @IsObject()
  @IsNotEmpty()
  responses!: Record<string, any>;
}

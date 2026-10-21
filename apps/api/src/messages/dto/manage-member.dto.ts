import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ManageMemberDto {
  @IsIn(['ADD', 'REMOVE'])
  @IsNotEmpty()
  action!: 'ADD' | 'REMOVE';

  @IsString()
  @IsNotEmpty()
  userId!: string;
}

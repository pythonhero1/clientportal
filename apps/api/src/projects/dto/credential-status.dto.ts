import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum CredentialShareMethodDto {
  COLLABORATOR_INVITE = 'COLLABORATOR_INVITE',
  BITWARDEN_SEND = 'BITWARDEN_SEND',
  DIRECT_DELEGATION = 'DIRECT_DELEGATION',
}

export enum CredentialShareStatusDto {
  REQUESTED = 'REQUESTED',
  INVITATION_SENT = 'INVITATION_SENT',
  SEND_LINK_PROVIDED = 'SEND_LINK_PROVIDED',
  RECEIVED_AND_VERIFIED = 'RECEIVED_AND_VERIFIED',
  REVOKED = 'REVOKED',
}

export class CredentialStatusDto {
  @IsString()
  @IsNotEmpty()
  platformName!: string;

  @IsEnum(CredentialShareMethodDto)
  method!: CredentialShareMethodDto;

  @IsEnum(CredentialShareStatusDto)
  @IsOptional()
  status?: CredentialShareStatusDto = CredentialShareStatusDto.INVITATION_SENT;

  @IsString()
  @IsOptional()
  instructions?: string;
}

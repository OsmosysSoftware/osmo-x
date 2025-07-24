import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsEnabledStatus, ProviderType } from 'src/common/constants/database';

export class CreateProviderChainInput {
  @IsString()
  chainName: string;

  @IsNumber()
  applicationId: number;

  @IsNumber()
  @IsEnum(ProviderType)
  providerType: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @IsEnum(IsEnabledStatus)
  isDefault?: number;
}

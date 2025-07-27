import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsEnabledStatus, ProviderType } from 'src/common/constants/database';

export class CreateProviderChainInput {
  @IsString()
  @IsNotEmpty()
  chainName: string;

  @IsNumber()
  @IsNotEmpty()
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

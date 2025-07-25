import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { IsEnabledStatus, ProviderType } from 'src/common/constants/database';

export class UpdateProviderChainInput {
  @IsNumber()
  chainId: number;

  @IsString()
  @IsOptional()
  chainName?: string;

  @IsNumber()
  @IsOptional()
  applicationId?: number;

  @IsNumber()
  @IsOptional()
  @IsEnum(ProviderType)
  providerType?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @IsEnum(IsEnabledStatus)
  isDefault?: number;
}

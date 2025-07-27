import { IsEnum, IsNumber } from 'class-validator';
import { IsEnabledStatus } from 'src/common/constants/database';

export class CreateProviderChainMemberInput {
  @IsNumber()
  chainId: number;

  @IsNumber()
  providerId: number;

  @IsNumber()
  @IsEnum(IsEnabledStatus)
  isActive: number;
}

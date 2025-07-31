import { IsEnum, IsNumber } from 'class-validator';
import { Status } from 'src/common/constants/database';

export class CreateProviderChainMemberInput {
  @IsNumber()
  chainId: number;

  @IsNumber()
  providerId: number;

  @IsNumber()
  @IsEnum(Status)
  isActive: number;
}

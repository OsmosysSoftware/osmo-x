import { IsNumber } from 'class-validator';

export class DeleteProviderChainMemberInput {
  @IsNumber()
  chainId: number;

  @IsNumber()
  providerId: number;
}

import { IsNumber } from 'class-validator';

export class DeleteProviderChainInput {
  @IsNumber()
  chainId: number;
}

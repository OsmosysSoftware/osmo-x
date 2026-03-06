import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class DeleteProviderChainMemberInput {
  @ApiProperty({ description: 'ID of the provider chain', example: 1 })
  @IsNumber()
  chainId: number;

  @ApiProperty({ description: 'ID of the provider to remove from the chain', example: 3 })
  @IsNumber()
  providerId: number;
}

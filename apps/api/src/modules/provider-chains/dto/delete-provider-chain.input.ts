import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class DeleteProviderChainInput {
  @ApiProperty({ description: 'ID of the provider chain to delete', example: 1 })
  @IsNumber()
  chainId: number;
}

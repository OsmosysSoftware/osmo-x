import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { Status } from 'src/common/constants/database';

export class CreateProviderChainMemberInput {
  @ApiProperty({ description: 'ID of the provider chain to add the member to', example: 1 })
  @IsNumber()
  chainId: number;

  @ApiProperty({ description: 'ID of the provider to add as a chain member', example: 3 })
  @IsNumber()
  providerId: number;

  @ApiProperty({
    description: 'Whether the chain member is active (0=Inactive, 1=Active)',
    example: 1,
    enum: [0, 1],
  })
  @IsNumber()
  @IsEnum(Status)
  isActive: number;
}

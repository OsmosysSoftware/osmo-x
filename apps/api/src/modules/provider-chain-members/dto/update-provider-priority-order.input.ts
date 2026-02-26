import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNumber } from 'class-validator';

export class UpdateProviderPriorityOrderInput {
  @ApiProperty({ description: 'ID of the provider chain to reorder', example: 1 })
  @IsNumber()
  chainId: number;

  @ApiProperty({
    description:
      'Ordered array of provider IDs representing the new priority order (first = highest priority)',
    type: [Number],
    example: [3, 1, 2],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  newProviderPriorityOrder: number[];
}

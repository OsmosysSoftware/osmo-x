import { ArrayMinSize, IsArray, IsNumber } from 'class-validator';

export class UpdateProviderPriorityOrderInput {
  @IsNumber()
  chainId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  newProviderPriorityOrder: number[];
}

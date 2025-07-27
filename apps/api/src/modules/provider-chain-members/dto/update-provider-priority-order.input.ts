import { IsArray, IsNumber } from 'class-validator';

export class UpdateProviderPriorityOrderInput {
  @IsNumber()
  chainId: number;

  @IsArray()
  newProviderPriorityOrder: number[];
}

import { IsNotEmpty } from 'class-validator';

export class WaTwilioDataDto {
  @IsNotEmpty()
  to: string;

  @IsNotEmpty()
  message: string;
}

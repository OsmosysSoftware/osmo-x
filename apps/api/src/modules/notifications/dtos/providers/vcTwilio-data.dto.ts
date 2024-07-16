import { IsNotEmpty } from 'class-validator';

export class VcTwilioDataDto {
  @IsNotEmpty()
  from: string;

  @IsNotEmpty()
  to: string;

  @IsNotEmpty()
  url: string;
}

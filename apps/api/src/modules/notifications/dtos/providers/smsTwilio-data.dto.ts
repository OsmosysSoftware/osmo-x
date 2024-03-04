import { IsNotEmpty } from 'class-validator';

export class SmsTwilioDataDto {
  @IsNotEmpty()
  to: string;

  @IsNotEmpty()
  message: string;
}

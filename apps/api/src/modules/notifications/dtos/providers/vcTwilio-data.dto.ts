import { IsNotEmpty } from 'class-validator';

export class VcTwilioDataDto {
  @IsNotEmpty()
  from: string;

  @IsNotEmpty()
  to: string;

  // Need atleast one of url, twiml for successful request
  url?: string;

  twiml?: string;
}

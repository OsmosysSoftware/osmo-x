import { IsNotEmpty, MaxLength } from 'class-validator';

export class SmsPlivoDataDto {
  // Source for max limit: https://www.plivo.com/docs/messaging/api/message#send-a-message
  // Phone number
  @IsNotEmpty()
  @MaxLength(14)
  to: string;

  // Message
  @IsNotEmpty()
  @MaxLength(1600)
  message: string;
}

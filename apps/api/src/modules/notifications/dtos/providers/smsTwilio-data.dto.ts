import { IsNotEmpty, MaxLength } from 'class-validator';

export class SmsTwilioDataDto {
  @IsNotEmpty()
  // Max length as per E.164 (https://www.twilio.com/docs/glossary/what-e164)
  @MaxLength(16)
  to: string;

  @IsNotEmpty()
  // Max length as per https://www.twilio.com/docs/glossary/what-sms-character-limit
  @MaxLength(1600)
  message: string;
}

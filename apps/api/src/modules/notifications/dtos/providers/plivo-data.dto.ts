import { IsNotEmpty, MaxLength } from 'class-validator';
import { IsNumberOrCommaSeparatedE164 } from 'src/common/decorators/is-number-or-comma-separated.decorator';

export class SmsPlivoDataDto {
  // Source for max limit: https://www.plivo.com/docs/messaging/api/message#send-a-message
  // Phone number
  @IsNotEmpty()
  @IsNumberOrCommaSeparatedE164()
  to: string;

  // Message
  @IsNotEmpty()
  @MaxLength(1600)
  message: string;
}

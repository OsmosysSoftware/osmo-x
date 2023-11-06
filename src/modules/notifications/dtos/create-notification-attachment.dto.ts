import { IsNotEmpty } from 'class-validator';
import { Stream } from 'stream';

export class CreateNotificationAttachmentDto {
  @IsNotEmpty()
  filename: string;

  @IsNotEmpty()
  content: string | Buffer | Stream;
}

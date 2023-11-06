import { IsNotEmpty, ValidateIf } from 'class-validator';
import { Stream } from 'stream';

export class CreateNotificationAttachmentDto {
  @IsNotEmpty()
  filename: string;

  @IsNotEmpty()
  @ValidateIf((obj) => !obj.path)
  content: string | Buffer | Stream;

  @IsNotEmpty()
  @ValidateIf((obj) => !obj.content)
  path: string;
}

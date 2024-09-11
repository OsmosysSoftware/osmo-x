import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import {
  AttachmentValidation,
  CreateNotificationAttachmentDto,
} from '../create-notification-attachment.dto';
import { IsStringOrStringArray } from 'src/common/decorators/is-string-or-stringarray.decorator';

export class AwsSesDataDto {
  @IsNotEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsStringOrStringArray({
    message: 'The "to" field must be either a string or an array of strings',
  })
  to: string | string[];

  @IsOptional()
  @IsStringOrStringArray({
    message: 'The "cc" field must be either a string or an array of strings',
  })
  cc?: string | string[];

  @IsOptional()
  @IsStringOrStringArray({
    message: 'The "bcc" field must be either a string or an array of strings',
  })
  bcc?: string | string[];

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty({ message: 'HTML or text must be provided' })
  @ValidateIf((obj) => !obj.html, { message: 'HTML or text must be provided' })
  text: string;

  @IsNotEmpty({ message: 'HTML or text must be provided' })
  @ValidateIf((obj) => !obj.text, { message: 'HTML or text must be provided' })
  html: string;

  @IsOptional()
  @IsStringOrStringArray({
    message: 'The "replyTo" field must be either a string or an array of strings',
  })
  replyTo?: string | string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateNotificationAttachmentDto)
  @AttachmentValidation()
  attachments: CreateNotificationAttachmentDto[];
}

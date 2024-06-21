import { IsString, IsNotEmpty, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import {
  AttachmentValidation,
  CreateNotificationAttachmentDto,
} from '../create-notification-attachment.dto';
import { Type } from 'class-transformer';

export class MailgunDataDto {
  @IsNotEmpty()
  from: string | string[];

  @IsNotEmpty()
  to: string | string[];

  @IsOptional()
  cc?: string | string[];

  @IsOptional()
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
  @ValidateNested({ each: true })
  @Type(() => CreateNotificationAttachmentDto)
  @AttachmentValidation()
  attachments: CreateNotificationAttachmentDto[];
}

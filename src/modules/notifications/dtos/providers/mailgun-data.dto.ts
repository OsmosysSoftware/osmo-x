import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { AttachmentValidation, CreateNotificationAttachmentDto } from '../create-notification-attachment.dto';
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

  @IsNotEmpty()
  @IsString()
  text: string;

  @IsNotEmpty()
  @IsString()
  html: string;

  @IsOptional()
  @Type(() => CreateNotificationAttachmentDto)
  @AttachmentValidation()
  attachments: CreateNotificationAttachmentDto[];
}

import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { CreateNotificationAttachmentDto } from '../create-notification-attachment.dto';
import { Type } from 'class-transformer';

export class SMTPDataDto {
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
  @ValidateNested({ each: true })
  @Type(() => CreateNotificationAttachmentDto)
  attachments: CreateNotificationAttachmentDto[];
}

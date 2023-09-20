import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { CreateNotificationAttachmentDto } from './create-notification-attachment.dto';

export class CreateNotificationDataDto {
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
  @ValidateNested()
  @Type(() => CreateNotificationAttachmentDto)
  attachments: CreateNotificationAttachmentDto[];
}

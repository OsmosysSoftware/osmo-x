import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import {
  AttachmentValidation,
  CreateNotificationAttachmentDto,
} from '../create-notification-attachment.dto';

export class AwsSesDataDto {
  @IsNotEmpty()
  @IsString()
  from: string | string[];

  @IsNotEmpty()
  @IsString()
  to: string | string[];

  @IsOptional()
  @IsString()
  cc?: string | string[];

  @IsOptional()
  @IsString()
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
  @IsString()
  replyTo?: string | string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateNotificationAttachmentDto)
  @AttachmentValidation()
  attachments: CreateNotificationAttachmentDto[];
}

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { IsAttachmentDataValid } from 'src/common/decorators/is-attachment-data-valid.decorator';

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
  @IsAttachmentDataValid()
  attachments: Record<string, unknown>[];
}

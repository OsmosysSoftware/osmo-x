import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class AwsSesDataDto {
  @IsNotEmpty()
  fromAddress: string | string[];

  @IsNotEmpty()
  toAddresses: string | string[];

  @IsOptional()
  ccAddresses?: string | string[];

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
  replyToAddresses?: string | string[];
}

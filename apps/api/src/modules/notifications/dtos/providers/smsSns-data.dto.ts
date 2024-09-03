import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SmsSnsDataDto {
  @IsNotEmpty()
  @MaxLength(16)
  to: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

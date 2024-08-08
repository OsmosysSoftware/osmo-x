import { IsString, IsNotEmpty } from 'class-validator';

export class SmsSnsDataDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

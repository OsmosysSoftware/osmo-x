import { IsNotEmpty } from 'class-validator';

export class KapsystemDataDto {
  @IsNotEmpty()
  SMSText: string;

  @IsNotEmpty()
  GSM: string;
}

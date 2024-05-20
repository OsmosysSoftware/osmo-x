import { IsNotEmpty } from 'class-validator';

export class SmsKapsystemDataDto {
  @IsNotEmpty()
  indiaDltContentTemplateId: string;

  @IsNotEmpty()
  indiaDltPrincipalEntityId: string;

  @IsNotEmpty()
  text: string;

  @IsNotEmpty()
  to: string;
}

import { IsNotEmpty } from 'class-validator';

export class KapsystemDataDto {
  @IsNotEmpty()
  indiaDltContentTemplateId: string;

  @IsNotEmpty()
  indiaDltPrincipalEntityId: string;

  @IsNotEmpty()
  text: string;

  @IsNotEmpty()
  to: string;
}

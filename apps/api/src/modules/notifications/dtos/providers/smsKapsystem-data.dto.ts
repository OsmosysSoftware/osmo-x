import { IsNotEmpty } from 'class-validator';
import { IsNumberOrCommaSeparatedNumber } from 'src/common/decorators/is-number-or-comma-separated.decorator';

export class SmsKapsystemDataDto {
  @IsNotEmpty()
  indiaDltContentTemplateId: string;

  @IsNotEmpty()
  indiaDltPrincipalEntityId: string;

  @IsNotEmpty()
  text: string;

  @IsNotEmpty()
  @IsNumberOrCommaSeparatedNumber()
  to: string;
}

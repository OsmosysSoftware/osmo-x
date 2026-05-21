import { IsNumber, IsObject, IsString, ValidateIf } from 'class-validator';
import { IsDataValid } from 'src/common/decorators/is-data-valid.decorator';
import { OnlyOneOf } from 'src/common/decorators/only-one-of.decorator';

export class CreateNotificationDto {
  // Used to trigger OnlyOneOf validator
  // Note that ApiKeyGuard performs this validation first
  @OnlyOneOf('providerId', 'providerChain', {
    message: 'Either providerId or providerChain must be provided, but not both.',
  })
  dummy: unknown;

  @ValidateIf((obj) => !obj.providerChain)
  @IsNumber()
  providerId?: number;

  @ValidateIf((obj) => !obj.providerId)
  @IsString()
  providerChain?: string;

  @IsObject()
  @IsDataValid()
  data: Record<string, unknown>;
}

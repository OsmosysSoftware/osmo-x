/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsString,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'AllowedProperties', async: false })
class AllowedPropertiesConstraint implements ValidatorConstraintInterface {
  validate(message: unknown) {
    const allowedKeys = ['GCM', 'APNS_SANDBOX', 'APNS', 'default'];
    return Object.keys(message).every((key) => allowedKeys.includes(key));
  }

  defaultMessage() {
    return 'Invalid properties found in the message payload. Allowed properties are GCM, APNS_SANDBOX, APNS, and default.';
  }
}

class MessagePayload {
  @IsOptional()
  @IsString()
  GCM?: string;

  @IsOptional()
  @IsString()
  APNS_SANDBOX?: string;

  @IsOptional()
  @IsString()
  APNS?: string;

  @IsOptional()
  @IsString()
  default?: string;
}

export class PushSnsDataDto {
  @IsNotEmpty()
  target: string;

  @IsNotEmpty()
  @ValidateNested()
  @Validate(AllowedPropertiesConstraint)
  @Type(() => MessagePayload)
  message: MessagePayload;
}

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
    const inputKeys = Object.keys(message);

    // Check if the object is empty
    if (inputKeys.length === 0) {
      return false;
    }

    // Check if ALL present keys are within the allowed list
    return Object.keys(message).every((key) => allowedKeys.includes(key));
  }

  defaultMessage() {
    return 'Invalid properties found in the message payload. Input object must contain at least one of the allowed properties. Allowed properties are GCM, APNS_SANDBOX, APNS, and default.';
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

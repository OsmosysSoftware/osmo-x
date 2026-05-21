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
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OnlyOneOf } from 'src/common/decorators/only-one-of.decorator';

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
  @ApiPropertyOptional({
    description: 'GCM/FCM message JSON string',
    example: '{"notification":{"title":"Test","body":"Hello"}}',
  })
  @IsOptional()
  @IsString()
  GCM?: string;

  @ApiPropertyOptional({ description: 'APNS sandbox message JSON string' })
  @IsOptional()
  @IsString()
  APNS_SANDBOX?: string;

  @ApiPropertyOptional({ description: 'APNS production message JSON string' })
  @IsOptional()
  @IsString()
  APNS?: string;

  @ApiPropertyOptional({ description: 'Default fallback message string' })
  @IsOptional()
  @IsString()
  default?: string;
}

export class PushSnsDataDto {
  @ApiPropertyOptional({
    description:
      'SNS endpoint ARN for single-device delivery. Provide exactly one of target or topicArn.',
    example: 'arn:aws:sns:us-west-2:505884080245:endpoint/GCM/Android/7fb080a5-...',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'target must not be empty when provided' })
  target?: string;

  @ApiPropertyOptional({
    description:
      'SNS topic ARN for broadcast delivery to all subscribers. Provide exactly one of target or topicArn.',
    example: 'arn:aws:sns:us-west-2:505884080245:my-app-all-users',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'topicArn must not be empty when provided' })
  topicArn?: string;

  @ApiProperty({
    description:
      'Platform-specific message payloads. Must contain at least one of: GCM, APNS_SANDBOX, APNS, default.',
    type: () => MessagePayload,
  })
  @OnlyOneOf('target', 'topicArn', {
    message: 'Either "target" or "topicArn" must be provided, but not both.',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Validate(AllowedPropertiesConstraint)
  @Type(() => MessagePayload)
  message: MessagePayload;
}

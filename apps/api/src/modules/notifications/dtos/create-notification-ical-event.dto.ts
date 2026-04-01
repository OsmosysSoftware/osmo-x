import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export class CreateNotificationIcalEventDto {
  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsNotEmpty({ message: 'Content or path must be provided for icalEvent' })
  @ValidateIf((obj) => !obj.path, {
    message: 'Content or path must be provided for icalEvent',
  })
  content?: string | Buffer;

  @IsNotEmpty({ message: 'Content or path must be provided for icalEvent' })
  @ValidateIf((obj) => !obj.content, {
    message: 'Content or path must be provided for icalEvent',
  })
  path?: string;
}

export function IcalEventValidation(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'icalEventValidation',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: Record<string, unknown> | undefined) {
          if (!value) {
            return true;
          }

          const path = value['path'];
          const content = value['content'];

          return Boolean(path || content);
        },
        defaultMessage(args: ValidationArguments) {
          if (!args.value) {
            return 'Invalid icalEvent';
          }

          return 'Content or path must be provided for icalEvent';
        },
      },
    });
  };
}

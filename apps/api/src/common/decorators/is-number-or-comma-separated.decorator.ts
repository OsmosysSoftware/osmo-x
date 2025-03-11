import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

const E164_PATTERN = /^\+[1-9]\d{1,14}$/;

const NUMBER_PATTERN = /[91]*\d{1,14}$/;

export function IsNumberOrCommaSeparatedE164(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'IsNumberOrCommaSeparatedE164',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        validate(value: any) {
          if (typeof value !== 'string') return false;

          // Trim spaces and split the string by commas
          const numbers = value.split(',').map((num) => num.trim());

          // Check if the array contains less than 100 items
          // Limit 1000: https://www.plivo.com/docs/messaging/api/message#bulk-messaging
          if (numbers.length > 100) return false;

          // Validate each part with the E164 regex
          return numbers.every((num) => E164_PATTERN.test(num));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid E164 number or a comma-separated string of valid E164 numbers.`;
        },
      },
    });
  };
}

export function IsNumberOrCommaSeparatedNumber(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'IsNumberOrCommaSeparatedNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        validate(value: any) {
          if (typeof value !== 'string') return false;

          // Trim spaces and split the string by commas
          const numbers = value.split(',').map((num) => num.trim());

          // Check if the array contains less than 10 items
          // Limit 100: http://trans.kapsystem.com/readme/4.0/send-sms
          if (numbers.length > 10) return false;

          // Validate each part with the Number regex
          return numbers.every((num) => NUMBER_PATTERN.test(num));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid number or a comma-separated string of valid numbers.`;
        },
      },
    });
  };
}

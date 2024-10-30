import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStringOrStringArray(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'isStringOrStringArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        validate(value: any, args: ValidationArguments) {
          if (typeof value === 'string') {
            return true; // Valid if it's a string
          }

          if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
            return true; // Valid if it's an array of strings
          }

          return false; // Invalid otherwise
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be either a string or an array of strings`;
        },
      },
    });
  };
}

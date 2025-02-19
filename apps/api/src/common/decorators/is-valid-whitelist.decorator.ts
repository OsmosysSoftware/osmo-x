import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsValidWhitelistConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    // Allow null or undefined
    if (value === null || value === undefined) return true;

    // Must be an object
    if (typeof value !== 'object' || Array.isArray(value)) return false;

    return Object.keys(value).every((key) => {
      // Ensure key is a numeric string
      if (!/^\d+$/.test(key)) return false;

      // Ensure value is an array of strings
      const items = value[key];
      return Array.isArray(items) && items.every((item) => typeof item === 'string');
    });
  }

  defaultMessage(): string {
    return 'Whitelist must be null or a valid JSON string with string of provider id as keys and arrays of strings of recipients as values';
  }
}

export function IsValidWhitelist(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidWhitelistConstraint,
    });
  };
}

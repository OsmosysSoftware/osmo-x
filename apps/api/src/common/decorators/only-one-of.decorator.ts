import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function OnlyOneOf(
  property1: string,
  property2: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'onlyOneOf',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property1, property2],
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const [prop1, prop2] = args.constraints;
          const val1 = (args.object as unknown)[prop1];
          const val2 = (args.object as unknown)[prop2];

          return (val1 && !val2) || (!val1 && val2);
        },
        defaultMessage(args: ValidationArguments) {
          const [prop1, prop2] = args.constraints;

          return `Either "${prop1}" or "${prop2}" must be provided, but not both.`;
        },
      },
    });
  };
}

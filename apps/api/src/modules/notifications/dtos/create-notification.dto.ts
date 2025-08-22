import { IsNumber, IsObject, IsString, ValidateIf } from 'class-validator';
import { IsDataValid } from 'src/common/decorators/is-data-valid.decorator';
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Custom decorator to ensure only one of providerId or providerChain is set
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

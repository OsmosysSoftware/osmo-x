import {
  IsNotEmpty,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Stream } from 'stream';

export class CreateNotificationAttachmentDto {
  @IsNotEmpty({ message: 'Filename cannot be empty' })
  filename: string;

  @IsNotEmpty({ message: 'Content or path must be provided' })
  @ValidateIf((obj) => !obj.path, { message: 'Content or path must be provided' })
  content: string | Buffer | Stream;

  @IsNotEmpty({ message: 'Content or path must be provided' })
  @ValidateIf((obj) => !obj.content, { message: 'Content or path must be provided' })
  path: string;
}

// TODO: Custom Validator added for the bug
// https://github.com/OsmosysSoftware/osmo-notify/pull/62
export function AttachmentValidation(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'attachmentValidation',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown[]) {
          if (!value || value.length === 0) {
            return false;
          }

          for (const attachment of value) {
            const path = attachment['path'];
            const content = attachment['content'];
            const filename = attachment['filename'];

            if ((!path && !content) || !filename?.length) {
              return false;
            }
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          if (!args.value || args.value.length === 0) {
            return 'Attachments must be provided';
          }

          for (const attachment of args.value) {
            if (!attachment['filename']?.length) {
              return 'Filename cannot be empty';
            }

            if (!attachment['content'] && !attachment['path']) {
              return 'Content or path must be provided for each attachment';
            }
          }

          return 'Invalid attachments';
        },
      },
    });
  };
}

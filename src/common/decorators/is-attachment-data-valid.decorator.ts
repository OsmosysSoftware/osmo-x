import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  validate,
  ValidationError,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { CreateNotificationAttachmentDto } from 'src/modules/notifications/dtos/create-notification-attachment.dto';
import { SMTPDataDto } from 'src/modules/notifications/dtos/providers/smtp-data.dto';
import { MailgunDataDto } from 'src/modules/notifications/dtos/providers/mailgun-data.dto';

@ValidatorConstraint({ async: true })
export class IsAttachmentDataValidConstraint implements ValidatorConstraintInterface {
  async validate(attachments: object[]): Promise<boolean> {
    const validateAndThrowError = async (validationData: object): Promise<void> => {
      const errors: ValidationError[] = await validate(validationData);

      if (errors.length > 0) {
        const validationErrors = errors.map((obj) => Object.values(obj.constraints));
        throw new BadRequestException(...validationErrors);
      }
    };

    for (const attachment of attachments) {
      const attachmentData = new CreateNotificationAttachmentDto();
      Object.assign(attachmentData, attachment);
      await validateAndThrowError(attachmentData);
    }

    return true;
  }
}

export function IsAttachmentDataValid(validationOptions?: ValidationOptions) {
  return function (object: SMTPDataDto | MailgunDataDto, propertyName: string) {
    registerDecorator({
      name: 'isAttachmentDataValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsAttachmentDataValidConstraint,
    });
  };
}

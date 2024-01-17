import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  validate,
  ValidationError,
} from 'class-validator';
import { ChannelType } from 'src/common/constants/notifications';
import { SMTPDataDto } from 'src/modules/notifications/dtos/providers/smtp-data.dto';
import { MailgunDataDto } from 'src/modules/notifications/dtos/providers/mailgun-data.dto';
import { Wa360DialogDataDto } from 'src/modules/notifications/dtos/providers/wa360Dialog-data.dto';
import { BadRequestException } from '@nestjs/common';
import { CreateNotificationDto } from 'src/modules/notifications/dtos/create-notification.dto';
import { WaTwilioDataDto } from 'src/modules/notifications/dtos/providers/waTwilio-data.dto';

@ValidatorConstraint({ async: true })
export class IsDataValidConstraint implements ValidatorConstraintInterface {
  async validate(value: object, args: ValidationArguments): Promise<boolean> {
    const object = args.object as { channelType: number; data: object };
    const { channelType } = object;

    const validateAndThrowError = async (validationData: object): Promise<void> => {
      const errors: ValidationError[] = await validate(validationData);

      if (errors.length > 0) {
        const validationErrors = errors.map((obj) => Object.values(obj.constraints));
        throw new BadRequestException(...validationErrors);
      }
    };

    switch (channelType) {
      case ChannelType.SMTP:
        const smtpData = new SMTPDataDto();
        Object.assign(smtpData, value);
        await validateAndThrowError(smtpData);
        return true;

      case ChannelType.MAILGUN:
        const mailgunData = new MailgunDataDto();
        Object.assign(mailgunData, value);
        await validateAndThrowError(mailgunData);
        return true;

      case ChannelType.WA_360_DAILOG:
        const wa360DialogData = new Wa360DialogDataDto();
        Object.assign(wa360DialogData, value);
        await validateAndThrowError(wa360DialogData);
        return true;

      case ChannelType.WA_TWILIO:
        const waTwilioData = new WaTwilioDataDto();
        Object.assign(waTwilioData, value);
        await validateAndThrowError(waTwilioData);
        return true;

      default:
        return false;
    }
  }
}

export function IsDataValid(validationOptions?: ValidationOptions) {
  return function (object: CreateNotificationDto, propertyName: string) {
    registerDecorator({
      name: 'isDataValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsDataValidConstraint,
    });
  };
}

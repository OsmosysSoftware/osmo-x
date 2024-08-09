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
import { BadRequestException, Logger } from '@nestjs/common';
import { CreateNotificationDto } from 'src/modules/notifications/dtos/create-notification.dto';
import { WaTwilioDataDto } from 'src/modules/notifications/dtos/providers/waTwilio-data.dto';
import { SmsTwilioDataDto } from 'src/modules/notifications/dtos/providers/smsTwilio-data.dto';
import { SmsPlivoDataDto } from 'src/modules/notifications/dtos/providers/plivo-data.dto';
import { WaTwilioBusinessDataDto } from 'src/modules/notifications/dtos/providers/waTwilioBusiness-data.dto';
import { Injectable } from '@nestjs/common';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { SmsKapsystemDataDto } from 'src/modules/notifications/dtos/providers/smsKapsystem-data.dto';
import { PushSnsDataDto } from 'src/modules/notifications/dtos/providers/pushSns-data.dto';
import { VcTwilioDataDto } from 'src/modules/notifications/dtos/providers/vcTwilio-data.dto';
import { AwsSesDataDto } from 'src/modules/notifications/dtos/providers/awsSes-data.dto';

@ValidatorConstraint({ name: 'isDataValidConstraint', async: true })
@Injectable()
export class IsDataValidConstraint implements ValidatorConstraintInterface {
  constructor(
    private readonly providersService: ProvidersService,
    private logger: Logger,
  ) {}

  async validate(value: object, args: ValidationArguments): Promise<boolean> {
    this.logger.debug('Request data validation started');
    const object = args.object as { providerId: number; data: object };
    let channelTypeFromProviderId = null;

    try {
      channelTypeFromProviderId = (await this.providersService.getById(object.providerId))
        .channelType;
      this.logger.debug(
        `Fetched channel type: ${channelTypeFromProviderId} from provider Id: ${object.providerId}`,
      );
    } catch (error) {
      throw new Error(`Error while fetching channelType from ProviderId: ${error}`);
    }

    const validateAndThrowError = async (validationData: object): Promise<void> => {
      this.logger.debug('Awaiting Validation of request data as per request channel type');
      const errors: ValidationError[] = await validate(validationData);

      if (errors.length > 0) {
        const validationErrors = errors.map((obj) => Object.values(obj.constraints));
        throw new BadRequestException(...validationErrors);
      }
    };

    switch (channelTypeFromProviderId) {
      case ChannelType.SMTP: {
        const smtpData = new SMTPDataDto();
        Object.assign(smtpData, value);
        await validateAndThrowError(smtpData);
        return true;
      }

      case ChannelType.MAILGUN: {
        const mailgunData = new MailgunDataDto();
        Object.assign(mailgunData, value);
        await validateAndThrowError(mailgunData);
        return true;
      }

      case ChannelType.WA_360_DAILOG: {
        const wa360DialogData = new Wa360DialogDataDto();
        Object.assign(wa360DialogData, value);
        await validateAndThrowError(wa360DialogData);
        return true;
      }

      case ChannelType.WA_TWILIO: {
        const waTwilioData = new WaTwilioDataDto();
        Object.assign(waTwilioData, value);
        await validateAndThrowError(waTwilioData);
        return true;
      }

      case ChannelType.SMS_TWILIO: {
        const smsTwilioData = new SmsTwilioDataDto();
        Object.assign(smsTwilioData, value);
        await validateAndThrowError(smsTwilioData);
        return true;
      }

      case ChannelType.SMS_PLIVO: {
        const smsPlivoData = new SmsPlivoDataDto();
        Object.assign(smsPlivoData, value);
        await validateAndThrowError(smsPlivoData);
        return true;
      }

      case ChannelType.WA_TWILIO_BUSINESS: {
        const waTwilioBusinessData = new WaTwilioBusinessDataDto();
        Object.assign(waTwilioBusinessData, value);
        await validateAndThrowError(waTwilioBusinessData);
        return true;
      }

      case ChannelType.SMS_KAPSYSTEM: {
        const kapsystemData = new SmsKapsystemDataDto();
        Object.assign(kapsystemData, value);
        await validateAndThrowError(kapsystemData);
        return true;
      }

      case ChannelType.PUSH_SNS: {
        const pushSnsData = new PushSnsDataDto();
        Object.assign(pushSnsData, value);
        await validateAndThrowError(pushSnsData);
        return true;
      }

      case ChannelType.VC_TWILIO: {
        const vcTwilioData = new VcTwilioDataDto();
        Object.assign(vcTwilioData, value);
        await validateAndThrowError(vcTwilioData);
        return true;
      }

      case ChannelType.AWS_SES: {
        const awsSesData = new AwsSesDataDto();
        Object.assign(awsSesData, value);
        await validateAndThrowError(awsSesData);
        return true;
      }

      default: {
        return false;
      }
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

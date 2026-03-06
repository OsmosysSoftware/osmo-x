import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  validate,
  ValidationError,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';
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
import { PushSnsDataDto } from 'src/modules/notifications/dtos/providers/pushSns-data.dto';
import { VcTwilioDataDto } from 'src/modules/notifications/dtos/providers/vcTwilio-data.dto';
import { AwsSesDataDto } from 'src/modules/notifications/dtos/providers/awsSes-data.dto';
import { SmsSnsDataDto } from 'src/modules/notifications/dtos/providers/smsSns-data.dto';
import { ProviderChainsService } from 'src/modules/provider-chains/provider-chains.service';
import { ProviderChainMembersService } from 'src/modules/provider-chain-members/provider-chain-members.service';

@ValidatorConstraint({ name: 'isDataValidConstraint', async: true })
@Injectable()
export class IsDataValidConstraint implements ValidatorConstraintInterface {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly providerChainsService: ProviderChainsService,
    private readonly providerChainMembersService: ProviderChainMembersService,
    private logger: Logger = new Logger(IsDataValidConstraint.name),
  ) {}

  async validate(value: object, args: ValidationArguments): Promise<boolean> {
    this.logger.debug('Request data validation started');
    const object = args.object as { providerId: number; providerChain: string; data: object };

    // Recursively collect constraint messages from nested validation errors
    const collectConstraints = (errors: ValidationError[]): string[] => {
      const messages: string[] = [];

      for (const error of errors) {
        if (error.constraints) {
          messages.push(...Object.values(error.constraints));
        }

        if (error.children && error.children.length > 0) {
          messages.push(...collectConstraints(error.children));
        }
      }

      return messages;
    };

    // Method to validate data
    const validateAndThrowError = async (validationData: object): Promise<void> => {
      this.logger.debug('Awaiting Validation of request data as per request channel type');
      const errors: ValidationError[] = await validate(validationData);

      if (errors.length > 0) {
        const validationErrors = collectConstraints(errors);
        throw new BadRequestException(validationErrors);
      }
    };

    // Method to validate request data based on channel type
    const validateRequestDataBasedOnChannelType = async (
      inputChannelType: number,
    ): Promise<boolean> => {
      this.logger.debug(`Validate request body for channel type: ${inputChannelType}`);

      const dtoMap: Record<number, new () => object> = {
        [ChannelType.SMTP]: SMTPDataDto,
        [ChannelType.MAILGUN]: MailgunDataDto,
        [ChannelType.WA_360_DAILOG]: Wa360DialogDataDto,
        [ChannelType.WA_TWILIO]: WaTwilioDataDto,
        [ChannelType.SMS_TWILIO]: SmsTwilioDataDto,
        [ChannelType.SMS_PLIVO]: SmsPlivoDataDto,
        [ChannelType.WA_TWILIO_BUSINESS]: WaTwilioBusinessDataDto,
        [ChannelType.PUSH_SNS]: PushSnsDataDto,
        [ChannelType.VC_TWILIO]: VcTwilioDataDto,
        [ChannelType.AWS_SES]: AwsSesDataDto,
        [ChannelType.SMS_SNS]: SmsSnsDataDto,
      };

      const DtoClass = dtoMap[inputChannelType];

      if (!DtoClass) {
        return false;
      }

      const instance = plainToInstance(DtoClass, value);
      await validateAndThrowError(instance);

      return true;
    };

    // Begin validation of request data
    if (object.providerId && !object.providerChain) {
      // Notification request uses providerId
      try {
        const providerEntry = await this.providersService.getById(object.providerId);

        if (!providerEntry) {
          throw new BadRequestException(`Provider with ID ${object.providerId} not found.`);
        }

        this.logger.debug(
          `Fetched channel type: ${providerEntry.channelType} from provider with Id: ${object.providerId}`,
        );

        return await validateRequestDataBasedOnChannelType(providerEntry.channelType);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }

        this.logger.error(
          `Unexpected error while fetching providerId ${object.providerId}: ${error.message}`,
          error.stack,
        );
        throw new Error(
          `Unexpected error while fetching providerId ${object.providerId}: ${error.message}`,
        );
      }
    } else if (object.providerChain && !object.providerId) {
      // Notification request uses providerChain
      try {
        const providerChainEntry = await this.providerChainsService.getByProviderChainName(
          object.providerChain,
        );

        if (!providerChainEntry) {
          throw new BadRequestException(`ProviderChain ${object.providerChain} not found.`);
        }

        const allProviderChainMembersFromChainId =
          await this.providerChainMembersService.getAllProviderChainMembersByChainId(
            providerChainEntry.chainId,
          );

        if (!allProviderChainMembersFromChainId || allProviderChainMembersFromChainId.length <= 0) {
          throw new BadRequestException(
            `ProviderChain ${object.providerChain} does not have any members.`,
          );
        }

        for (const providerChainMemberEntry of allProviderChainMembersFromChainId) {
          this.logger.debug(`Check for ProviderChainMember ${providerChainMemberEntry.id}`);
          const inputProviderEntry = await this.providersService.getById(
            providerChainMemberEntry.providerId,
          );

          if (!inputProviderEntry) {
            throw new BadRequestException(
              `Provider with ID ${providerChainMemberEntry.providerId} (chain member ${providerChainMemberEntry.id}) not found.`,
            );
          }

          const isHealthy = await validateRequestDataBasedOnChannelType(
            inputProviderEntry.channelType,
          );

          if (!isHealthy) {
            // If any one entry fails validation return false
            this.logger.error(
              `Validation failed for ProviderChainMember ${providerChainMemberEntry.id} of ProviderChain ${object.providerChain}`,
            );
            return false;
          }
        }

        // Return true only when all entries pass validation
        return true;
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }

        this.logger.error(
          `Unexpected error while fetching ProviderChain ${object.providerChain}: ${error.message}`,
          error.stack,
        );
        throw new Error(
          `Unexpected error while fetching ProviderChain ${object.providerChain}: ${error.message}`,
        );
      }
    } else {
      this.logger.error(
        'IsDataValid Validation Failed. Pass either provderId or providerChainName in the request',
      );
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

import { ConfigService } from '@nestjs/config';
import { registerEnumType } from '@nestjs/graphql';

export function generateEnabledChannelEnum(configService: ConfigService): Record<string, number> {
  const enabledChannels: Record<string, number> = {};

  if (configService.get('ENABLE_SMTP') === 'true') {
    enabledChannels['SMTP'] = ChannelType.SMTP;
  }

  if (configService.get('ENABLE_MAILGUN') === 'true') {
    enabledChannels['MAILGUN'] = ChannelType.MAILGUN;
  }

  if (configService.get('ENABLE_WA360DIALOG') === 'true') {
    enabledChannels['WA_360_DAILOG'] = ChannelType.WA_360_DAILOG;
  }

  return enabledChannels as Record<string, number>;
}

export const DeliveryStatus = {
  PENDING: 1,
  IN_PROGRESS: 2,
  SUCCESS: 3,
  FAILED: 4,
};

export const ChannelType = {
  SMTP: 1,
  MAILGUN: 2,
  WA_360_DAILOG: 3,
};

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
});

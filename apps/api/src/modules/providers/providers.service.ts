import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';
import { ChannelType } from 'src/common/constants/notifications';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  async getConfigById(providerId: number): Promise<Record<string, unknown> | null> {
    const configEntity = await this.providerRepository.findOne({ where: { providerId } });

    if (configEntity) {
      return configEntity.configuration as unknown as Record<string, unknown>;
    }

    return null;
  }

  async generateEnabledChannelsEnum(): Promise<Record<string, number>> {
    const enabledChannels: Record<string, number> = {};

    // Get the config for all the providers. Add as per requirement
    const smtpConfig = await this.getConfigById(ChannelType.SMTP);
    const mailgunConfig = await this.getConfigById(ChannelType.MAILGUN);
    const wa360Config = await this.getConfigById(ChannelType.WA_360_DAILOG);
    const waTwilioConfig = await this.getConfigById(ChannelType.WA_TWILIO);
    const smsTwilioConfig = await this.getConfigById(ChannelType.SMS_TWILIO);

    // Set the enabled channels as per config in DB. Add cases as per requirement
    if ((smtpConfig.ENABLE_SMTP as boolean) === true) {
      enabledChannels['SMTP'] = ChannelType.SMTP;
    }

    if ((mailgunConfig.ENABLE_MAILGUN as boolean) === true) {
      enabledChannels['MAILGUN'] = ChannelType.MAILGUN;
    }

    if ((wa360Config.ENABLE_WA360DIALOG as boolean) === true) {
      enabledChannels['WA_360_DAILOG'] = ChannelType.WA_360_DAILOG;
    }

    if ((waTwilioConfig.ENABLE_WA_TWILIO as boolean) === true) {
      enabledChannels['WA_TWILIO'] = ChannelType.WA_TWILIO;
    }

    if ((smsTwilioConfig.ENABLE_SMS_TWILIO as boolean) === true) {
      enabledChannels['SMS_TWILIO'] = ChannelType.SMS_TWILIO;
    }

    return enabledChannels as Record<string, number>;
  }
}

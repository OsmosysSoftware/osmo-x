import { Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';
import { ProvidersService } from '../providers.service';

export interface VcTwilioData {
  from: string;
  to: string;
  url: string;
}

export interface VcTwilioResponseData {
  account_sid: string;
  annotation: string | null;
  answered_by: string | null;
  api_version: string;
  caller_name: string | null;
  date_created: string;
  date_updated: string;
  direction: string;
  duration: string;
  end_time: string;
  forwarded_from: string;
  from: string;
  from_formatted: string;
  group_sid: string | null;
  parent_call_sid: string | null;
  phone_number_sid: string;
  price: string;
  price_unit: string;
  sid: string;
  start_time: string;
  status: string;
  subresource_uris: {
    notifications: string;
    recordings: string;
    payments: string;
    events: string;
    siprec: string;
    streams: string;
    transcriptions: string;
    user_defined_message_subscriptions: string;
    user_defined_messages: string;
  };
  to: string;
  to_formatted: string;
  trunk_sid: string | null;
  uri: string;
  queue_time: string;
}

@Injectable()
export class VcTwilioService {
  private twilioClient;

  constructor(private readonly providersService: ProvidersService) {}

  async assignTransport(providerId: number): Promise<void> {
    const vcTwilioConfig = await this.providersService.getConfigById(providerId);
    const accountSid = vcTwilioConfig.TWILIO_VC_ACCOUNT_SID as string;
    const authToken = vcTwilioConfig.TWILIO_VC_AUTH_TOKEN as string;
    this.twilioClient = Twilio(accountSid, authToken);
  }

  async sendVoiceCall(body: VcTwilioData, providerId: number): Promise<VcTwilioResponseData> {
    try {
      await this.assignTransport(providerId);
      const voiceCall = await this.twilioClient.calls.create({
        from: body.from,
        to: body.to,
        url: body.url,
      });
      return voiceCall;
    } catch (error) {
      throw new Error(`Failed to send voice call: ${error.message}`);
    }
  }
}

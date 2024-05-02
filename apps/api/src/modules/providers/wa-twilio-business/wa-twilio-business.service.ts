import { Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';
import { ProvidersService } from '../providers.service';

export interface WaTwilioBusinessData {
  contentSid: string;
  from: string;
  contentVariables: object;
  to: string;
}

export interface WaTwilioBusinessResponseData {
  account_sid: string;
  api_version: string;
  body: string;
  date_created: string;
  date_sent: string;
  date_updated: string;
  direction: string;
  error_code: string | null;
  error_message: string | null;
  from: string;
  num_media: string;
  num_segments: string;
  price: string | null;
  price_unit: string | null;
  messaging_service_sid: string;
  sid: string;
  status: string;
  subresource_uris: object;
  to: string;
  uri: string;
}

@Injectable()
export class WaTwilioBusinessService {
  private twilioClient;

  constructor(private readonly providersService: ProvidersService) {}

  async assignTransport(providerId: number): Promise<void> {
    const waTwilioBusinessConfig = await this.providersService.getConfigById(providerId);
    const accountSid = waTwilioBusinessConfig.TWILIO_WA_ACCOUNT_SID as string;
    const authToken = waTwilioBusinessConfig.TWILIO_WA_AUTH_TOKEN as string;
    this.twilioClient = Twilio(accountSid, authToken);
  }

  async sendMessage(
    body: WaTwilioBusinessData,
    providerId: number,
  ): Promise<WaTwilioBusinessResponseData> {
    await this.assignTransport(providerId);
    const message = await this.twilioClient.messages.create({
      contentSid: body.contentSid,
      from: body.from,
      contentVariables: JSON.stringify(body.contentVariables),
      to: `whatsapp:${body.to}`,
    });
    return message;
  }
}

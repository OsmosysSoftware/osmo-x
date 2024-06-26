import { Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';
import { ProvidersService } from '../providers.service';

export interface WaTwilioData {
  to: string;
  message: string;
}

export interface WaTwilioResponseData {
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
export class WaTwilioService {
  private twilioClient;

  constructor(private readonly providersService: ProvidersService) {}

  async assignTransport(providerId: number): Promise<void> {
    const waTwilioConfig = await this.providersService.getConfigById(providerId);
    const accountSid = waTwilioConfig.TWILIO_WA_ACCOUNT_SID as string;
    const authToken = waTwilioConfig.TWILIO_WA_AUTH_TOKEN as string;
    this.twilioClient = Twilio(accountSid, authToken);
  }

  async sendMessage(body: WaTwilioData, providerId: number): Promise<WaTwilioResponseData> {
    await this.assignTransport(providerId);
    const waTwilioConfig = await this.providersService.getConfigById(providerId);
    const fromWhatsAppNumber = waTwilioConfig.TWILIO_WA_NUMBER as string;

    const message = await this.twilioClient.messages.create({
      body: body.message,
      from: `whatsapp:${fromWhatsAppNumber}`,
      to: `whatsapp:${body.to}`,
    });
    return message;
  }
}

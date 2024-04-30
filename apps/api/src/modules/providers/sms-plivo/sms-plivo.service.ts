import { Injectable } from '@nestjs/common';
import * as plivo from 'plivo';
import { ProvidersService } from '../providers.service';

export interface SmsPlivoData {
  to: string;
  message: string;
}

export interface SmsTwilioResponseData {
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
export class SmsPlivoService {
  private plivoClient;

  constructor(private readonly providersService: ProvidersService) {}

  async assignTransport(providerId: number): Promise<void> {
    const smsPlivoConfig = await this.providersService.getConfigById(providerId);
    const authId = smsPlivoConfig.PLIVO_SMS_AUTH_ID as string;
    const authToken = smsPlivoConfig.PLIVO_SMS_AUTH_TOKEN as string;
    this.plivoClient = new plivo.Client(authId, authToken);
  }

  async sendMessage(body: SmsPlivoData, providerId: number): Promise<unknown> {
    await this.assignTransport(providerId);
    const smsPlivoConfig = await this.providersService.getConfigById(providerId);
    const fromNumber = smsPlivoConfig.PLIVO_SMS_NUMBER as string;

    const response = await this.plivoClient.messages.create({
      src: fromNumber,
      dst: body.to,
      text: body.message,
    });

    return response;
  }
}

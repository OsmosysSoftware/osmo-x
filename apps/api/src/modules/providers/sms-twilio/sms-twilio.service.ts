import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

export interface SmsTwilioData {
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
export class SmsTwilioService {
  private twilioClient;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.getOrThrow<string>('TWILIO_SMS_ACCOUNT_SID');
    const authToken = this.configService.getOrThrow<string>('TWILIO_SMS_AUTH_TOKEN');
    this.twilioClient = Twilio(accountSid, authToken);
  }

  async sendMessage(body: SmsTwilioData): Promise<SmsTwilioResponseData> {
    const fromSmsNumber = this.configService.getOrThrow<string>('TWILIO_SMS_NUMBER');

    const message = await this.twilioClient.messages.create({
      body: body.message,
      from: fromSmsNumber,
      to: body.to,
    });
    return message;
  }
}

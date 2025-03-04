import { Injectable, Logger } from '@nestjs/common';
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

  constructor(
    private readonly providersService: ProvidersService,
    private logger: Logger = new Logger(WaTwilioBusinessService.name),
  ) {}

  async assignTransport(providerId: number): Promise<void> {
    this.logger.debug('Started assigning transport for Twilio Whatsapp Business');
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
    this.logger.debug('Sending Twilio Whatsapp Business');
    const message = await this.twilioClient.messages.create({
      contentSid: body.contentSid,
      from: body.from,
      contentVariables: JSON.stringify(body.contentVariables),
      to: `whatsapp:${body.to}`,
    });
    return message;
  }

  async getDeliveryStatus(sid: string, providerId: number): Promise<WaTwilioBusinessResponseData> {
    try {
      this.logger.debug('Fetching delivery status from Twilio Whatsapp Business');
      await this.assignTransport(providerId);
      const message = await this.twilioClient.messages(sid).fetch();
      this.logger.debug(`Twilio Whatsapp Business Delivery status: ${message}`);
      return message;
    } catch (error) {
      throw new Error(`Failed to fetch delivery status: ${error.message}`);
    }
  }
}

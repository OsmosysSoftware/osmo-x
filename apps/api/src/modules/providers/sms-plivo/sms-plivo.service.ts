import { Injectable, Logger } from '@nestjs/common';
import * as plivo from 'plivo';
import { ProvidersService } from '../providers.service';

export interface SmsPlivoData {
  to: string;
  message: string;
}

export interface SmsPlivoResponseData {
  apiId: string;
  message: string;
  messageUuid: string;
}

export interface PlivoMessageStatusResponse {
  apiId: string;
  errorCode: string;
  fromNumber: string;
  messageDirection: string;
  messageState: string;
  messageTime: string;
  messageType: string;
  messageUuid: string;
  resourceUri: string;
  toNumber: string;
  totalAmount: string;
  totalRate: string;
  units: number;
  powerpackID: string;
  tendlcCampaignId: string;
  tendlcRegistrationStatus: string;
  destinationCountryIso2: string;
  requesterIP: string;
  isDomestic: boolean;
  replacedSender: string;
  conversationId: string;
  conversationOrigin: string;
  conversationExpirationTimestamp: string;
  dltEntityID: string;
  dltTemplateID: string;
  dltTemplateCategory: string;
  destinationNetwork: string;
  carrierFees: string;
  carrierFeesRate: string;
  log: string;
}

@Injectable()
export class SmsPlivoService {
  private plivoClient;

  constructor(
    private readonly providersService: ProvidersService,
    private logger: Logger,
  ) {}

  async assignTransport(providerId: number): Promise<void> {
    this.logger.debug('Started assigning transport for SMS Plivo');
    const smsPlivoConfig = await this.providersService.getConfigById(providerId);
    const authId = smsPlivoConfig.PLIVO_SMS_AUTH_ID as string;
    const authToken = smsPlivoConfig.PLIVO_SMS_AUTH_TOKEN as string;
    this.plivoClient = new plivo.Client(authId, authToken);
  }

  async sendMessage(body: SmsPlivoData, providerId: number): Promise<SmsPlivoResponseData> {
    try {
      await this.assignTransport(providerId);
      const smsPlivoConfig = await this.providersService.getConfigById(providerId);
      const fromNumber = smsPlivoConfig.PLIVO_SMS_NUMBER as string;

      this.logger.debug('Sending Plivo SMS');
      const response = await this.plivoClient.messages.create({
        src: fromNumber,
        dst: body.to,
        text: body.message,
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }
  async getDeliveryStatus(
    messageUuid: string,
    providerId: number,
  ): Promise<PlivoMessageStatusResponse> {
    try {
      this.logger.debug('Fetching delivery status from Plivo SMS');
      await this.assignTransport(providerId);
      const response = await this.plivoClient.messages.get(messageUuid);
      this.logger.debug(`Delivery status: ${response}`);
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch delivery status: ${error.message}`);
    }
  }
}

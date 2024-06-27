import { Injectable } from '@nestjs/common';
import * as plivo from 'plivo';
import { ProvidersService } from '../providers.service';

export interface SmsPlivoData {
  to: string;
  message: string;
}

export interface SmsPlivoResponseData {
  api_id: string;
  message: string;
  message_uuid: string[];
}

export interface PlivoMessageStatusResponse {
  api_id: string;
  error_code: string;
  from_number: string;
  message_direction: string;
  message_state: string;
  message_time: string;
  message_type: string;
  message_uuid: string;
  resource_uri: string;
  to_number: string;
  total_amount: string;
  total_rate: string;
  units: number;
  status: string;
  // add any other fields you expect in the response
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

  async sendMessage(body: SmsPlivoData, providerId: number): Promise<SmsPlivoResponseData> {
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
  async getDeliveryStatus(
    messageUuid: string,
    providerId: number,
  ): Promise<PlivoMessageStatusResponse> {
    await this.assignTransport(providerId);

    const response = await this.plivoClient.messages.get(messageUuid);
    console.log(response);
    return response;
  }
}

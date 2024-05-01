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
}

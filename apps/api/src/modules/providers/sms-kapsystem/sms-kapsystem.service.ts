import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ProvidersService } from '../providers.service';
import { firstValueFrom } from 'rxjs';

export interface KapsystemData {
  indiaDltContentTemplateId: string;
  indiaDltPrincipalEntityId: string;
  text: string;
  to: string;
}

export interface KapsystemResponse {
  results: Results;
}

export interface Results {
  result: Result;
}

export interface Result {
  status: string;
  messageid: string;
  destination: string;
}

@Injectable()
export class SmsKapsystemService {
  private apiUrl;
  private username;
  private password;
  private from;

  constructor(
    private httpService: HttpService,
    private readonly providersService: ProvidersService,
  ) {}

  async assignKAPSystemValues(providerId: number): Promise<void> {
    const smsKapsystemConfig = await this.providersService.getConfigById(providerId);
    this.apiUrl = smsKapsystemConfig.KAP_SMS_BASE_API_URL as string;
    this.username = smsKapsystemConfig.KAP_SMS_ACCOUNT_USERNAME as string;
    this.password = smsKapsystemConfig.KAP_SMS_ACCOUNT_PASSWORD as string;
    this.from = smsKapsystemConfig.KAP_SMS_FROM as string;
  }

  async sendMessage(body: KapsystemData, providerId: number): Promise<KapsystemResponse> {
    await this.assignKAPSystemValues(providerId);

    function objToQueryString(obj: KapsystemData): string {
      let queryString = '';

      for (const key in obj) {
        if (queryString != '') {
          queryString += '&';
        }

        queryString += key + '=' + encodeURIComponent(obj[key]);
      }

      return queryString;
    }

    this.apiUrl =
      this.apiUrl +
      `?username=${this.username}&password=${this.password}&from=${this.from}&` +
      objToQueryString(body);

    const response = await this.httpService.get(this.apiUrl);
    const res = await firstValueFrom(response);

    return res.data;
  }
}

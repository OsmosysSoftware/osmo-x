import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ProvidersService } from '../providers.service';
import { lastValueFrom } from 'rxjs';

export interface Wa360DialogData {
  to: string;
  type: string;
  template?: {
    namespace: string;
    name: string;
    language: {
      policy: string;
      code: string;
    };
    components: Component[];
  };
  text?: {
    body: string;
  };
}
export interface Wa360DialogResponse {
  contacts: {
    input: string;
    wa_id: string;
  }[];
  messages: {
    id: string;
  }[];
  meta: {
    api_status: string;
    version: string;
  };
}

interface Component {
  type: string;
  parameters: Parameter[];
}

interface Parameter {
  type: string;
  text: string;
}

@Injectable()
export class Wa360dialogService {
  private apiUrl: string;
  private apiKey: string;

  constructor(
    private httpService: HttpService,
    private readonly providersService: ProvidersService,
    private logger: Logger,
  ) {}

  async assignWA360Values(providerId: number): Promise<void> {
    this.logger.debug('Started assigning 360Dialog Whatsapp values');
    const wa360Config = await this.providersService.getConfigById(providerId);
    this.apiUrl = wa360Config.WA_360_DIALOG_URL as string;
    this.apiKey = wa360Config.WA_360_DIALOG_API_KEY as string;
  }

  async sendMessage(body: Wa360DialogData, providerId: number): Promise<Wa360DialogResponse> {
    try {
      await this.assignWA360Values(providerId);
      const headers = {
        'D360-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      };
      this.logger.debug('Sending 360Dialog Whatsapp');
      const response = await lastValueFrom(this.httpService.post(this.apiUrl, body, { headers }));
      return response.data;
    } catch (error) {
      if (error.response) {
        const providerResponseError = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        };
        // Log relevant parts of the error response
        this.logger.error('Error from provider:', providerResponseError);

        throw error;
      } else {
        // Handle cases where there is no response (network issues, etc.)
        throw new Error(`Unexpected error occurred: ${error}`);
      }
    }
  }
}

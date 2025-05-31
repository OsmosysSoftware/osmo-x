import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ProvidersService } from '../providers.service';
import { firstValueFrom } from 'rxjs';

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
    private logger: Logger = new Logger(Wa360dialogService.name),
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
      const response = await firstValueFrom(this.httpService.post(this.apiUrl, body, { headers }));
      return response.data;
    } catch (error) {
      if (error.response) {
        // Log bad request
        if (error.response.status && error.response.status === 400) {
          this.logger.log(
            `Bad Request exception sent from provider: ${providerId} - (${error.response.status}): ${JSON.stringify(error.response.data ?? 'No Data')} - Error Message: ${error.message}`,
          );
        } else {
          // Log relevant parts of the error response
          this.logger.error(
            `Error sent from provider: ${providerId} - (${error.response.status ?? 'No Status'} ${error.response.statusText ?? 'No StatusText'}): ${JSON.stringify(error.response.data ?? 'No Data')} - Error Message: ${error.message}`,
            error.stack,
          );
        }

        throw error;
      } else {
        // Handle cases where there is no response (network issues, etc.)
        throw error;
      }
    }
  }
}

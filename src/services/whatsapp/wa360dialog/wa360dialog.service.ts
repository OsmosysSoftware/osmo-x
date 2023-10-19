import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async sendMessage(body: Wa360DialogData): Promise<Wa360DialogResponse> {
    try {
      const apiUrl = this.configService.getOrThrow<string>('WA_360_DIALOG_URL');
      const apiKey = this.configService.getOrThrow<string>('WA_360_DIALOG_API_KEY');

      const headers = {
        'D360-API-KEY': apiKey,
        'Content-Type': 'application/json',
      };

      const response = await this.httpService.post(apiUrl, body, { headers }).toPromise();

      return response.data;
    } catch (error) {
      throw new Error(`Failed to send POST request: ${error.message}`);
    }
  }
}

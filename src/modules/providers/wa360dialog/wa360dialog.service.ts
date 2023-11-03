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
  private apiUrl: string;
  private apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiUrl = this.configService.getOrThrow<string>('WA_360_DIALOG_URL');
    this.apiKey = this.configService.getOrThrow<string>('WA_360_DIALOG_API_KEY');
  }

  async sendMessage(body: Wa360DialogData): Promise<Wa360DialogResponse> {
    const headers = {
      'D360-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
    };
    const response = await this.httpService.post(this.apiUrl, body, { headers }).toPromise();
    return response.data;
  }
}

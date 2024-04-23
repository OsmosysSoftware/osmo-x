import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProvidersService } from '../providers.service';
import { ChannelType } from 'src/common/constants/notifications';

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
    private readonly providersService: ProvidersService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.assignWA360Values();
  }

  async assignWA360Values(): Promise<void> {
    const wa360Config = await this.providersService.getConfigById(ChannelType.WA_360_DAILOG);
    this.apiUrl = wa360Config.WA_360_DIALOG_URL as string;
    this.apiKey = wa360Config.WA_360_DIALOG_API_KEY as string;
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

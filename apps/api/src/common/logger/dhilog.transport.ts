import { HttpService } from '@nestjs/axios';
import TransportStream = require('winston-transport');
import { TransportStreamOptions } from 'winston-transport';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common/services/logger.service';
import { firstValueFrom } from 'rxjs';
import { stringify } from 'flatted';

interface CustomTransportOptions extends TransportStreamOptions {
  httpService: HttpService;
  configService: ConfigService;
}

interface LogInfo {
  level: string;
  message: string;
  timestamp?: string;
  context?: string;
  stack?: string;
  severity: string;
}

export class DhilogTransport extends TransportStream {
  private readonly httpService: HttpService;
  private readonly configService: ConfigService;
  private readonly logger = new Logger(DhilogTransport.name);

  constructor(options: CustomTransportOptions) {
    super(options);
    this.httpService = options.httpService;
    this.configService = options.configService;
  }

  async log(info: LogInfo, callback: () => void): Promise<void> {
    const allowedLevels = (this.configService.get<string>('DHILOG_LOG_LEVEL') || 'error')
      .split(',')
      .map((level) => level.trim());
    const logType = this.configService.get<string>('DHILOG_LOG_TYPE') || 'Exceptions';

    if (allowedLevels.includes(info.level)) {
      const apiEndpoint = this.configService.get<string>('DHILOG_API_ENDPOINT');
      const apiKey = this.configService.get<string>('DHILOG_API_TOKEN');

      this.logger.log(`Log Info: ${stringify(info)}`);

      const logCreatedOn = info.timestamp || new Date().toISOString();

      try {
        const response = await firstValueFrom(
          this.httpService.post(
            apiEndpoint,
            {
              moduleName: info.context || 'Unknown Module',
              logDescription: info.message,
              logType: logType,
              logCreatedOn: logCreatedOn,
              severity: info.severity,
              logData: {
                message: info.message,
                stack: info.stack,
                context: info.context,
              },
            },
            { headers: { 'slogerr-secure-api-key': apiKey } },
          ),
        );

        if (response.status !== 200) {
          this.logger.warn(
            `Failed to send log to Dhilog. Status: ${response.status}, Message: ${response.statusText}`,
          );
        } else {
          this.logger.log('Error log successfully sent to Dhilog', response);
        }
      } catch (error) {
        this.logger.warn('Failed to send log to Dhilog', error.message);
      }
    }

    callback();
  }
}

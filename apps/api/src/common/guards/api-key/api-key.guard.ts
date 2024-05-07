import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { IsEnabledStatus } from 'src/common/constants/database';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { ServerApiKeysService } from 'src/modules/server-api-keys/server-api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly serverApiKeysService: ServerApiKeysService,
    private readonly providersService: ProvidersService,
    private logger: Logger,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return this.validateRequest(context);
  }

  async validateRequest(execContext: ExecutionContext): Promise<boolean> {
    const request = execContext.switchToHttp().getRequest();

    // Get api key header incase of http request
    if (request && request.headers) {
      const serverApiKeyHeader = request.headers['x-api-key'];
      const requestProviderId = request.body.providerId;
      const validationResult = await this.validateApiKeyHeader(
        serverApiKeyHeader,
        requestProviderId,
      );

      if (validationResult) {
        return true;
      }
    }

    // Get api key header incase of graphql request
    const ctx = GqlExecutionContext.create(execContext);
    const req = ctx.getContext().req;
    const serverApiKeyHeader = req.headers['x-api-key'];
    const requestProviderId = request.body.providerId;
    const validationResult = await this.validateApiKeyHeader(serverApiKeyHeader, requestProviderId);

    if (validationResult) {
      return true;
    }

    throw new UnauthorizedException('Invalid API key');
  }

  async validateApiKeyHeader(
    serverApiKeyHeader: string,
    requestProviderId: number,
  ): Promise<boolean> {
    let apiKeyToken = null;

    if (serverApiKeyHeader) {
      apiKeyToken = serverApiKeyHeader;
    } else {
      this.logger.error('Header x-api-key was not provided');
      throw new UnauthorizedException('Header x-api-key was not provided');
    }

    const apiKeyEntry = await this.serverApiKeysService.findByServerApiKey(apiKeyToken);

    if (!apiKeyEntry) {
      //this.logger.error('Invalid x-api-key');
      throw new UnauthorizedException('Invalid x-api-key');
    }

    // Get channel type from providerId & Set the channelType based on providerEntry
    const providerEntry = await this.providersService.getById(requestProviderId);

    if (!providerEntry) {
      this.logger.error('Provider does not exist');
      throw new BadRequestException('Provider does not exist');
    }

    // Check if provider is enabled or not
    if (providerEntry.isEnabled != IsEnabledStatus.TRUE) {
      this.logger.error(`Provider ${providerEntry.name} is not enabled`);
      throw new BadRequestException(`Provider ${providerEntry.name} is not enabled`);
    }

    // Set correct ApplicationId after verifying
    const inputApplicationId = await this.getApplicationIdFromApiKey(apiKeyToken);

    if (inputApplicationId != providerEntry.applicationId) {
      this.logger.error('The applicationId for Server Key and Provider do not match.');
      throw new BadRequestException('The applicationId for Server Key and Provider do not match.');
    }

    if (apiKeyToken && apiKeyToken === apiKeyEntry.apiKey) {
      return true;
    }

    return false;
  }

  // Get correct applicationId using apiKeyToken
  async getApplicationIdFromApiKey(apiKeyToken: string): Promise<number> {
    try {
      const apiKeyEntry = await this.serverApiKeysService.findByServerApiKey(apiKeyToken);

      if (!apiKeyEntry || !apiKeyEntry.applicationId) {
        this.logger.error('Related Api Key does not exist');
        throw new Error('Related Api Key does not exist');
      }

      return apiKeyEntry.applicationId;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}

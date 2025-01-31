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
import { compareApiKeys } from 'src/common/utils/bcrypt';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly serverApiKeysService: ServerApiKeysService,
    private readonly providersService: ProvidersService,
    private logger: Logger = new Logger(ApiKeyGuard.name),
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return this.validateRequest(context);
  }

  async validateRequest(execContext: ExecutionContext): Promise<boolean> {
    const request = execContext.switchToHttp().getRequest();
    this.logger.debug(
      `Request validation started for request body: ${JSON.stringify(request.body)}`,
    );

    // Get api key header incase of http request
    if (request && request.headers) {
      this.logger.debug(`Fetching request header and provider ID: ${request.body.providerId}`);
      const serverApiKeyHeader = request.headers['x-api-key'];
      this.logger.debug('Fetching provider Id');
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
    this.logger.debug(
      `Fetching request header and provider ID for GraphQL: ${req.body.providerId}`,
    );
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
    this.logger.debug('validateApiKeyHeader started');
    let apiKeyToken = null;

    if (serverApiKeyHeader) {
      apiKeyToken = serverApiKeyHeader;
    } else {
      this.logger.error('Header x-api-key was not provided');
      throw new UnauthorizedException('Header x-api-key was not provided');
    }

    // Get channel type from providerId & Set the channelType based on providerEntry
    const providerEntry = await this.providersService.getById(requestProviderId);
    this.logger.debug(
      `Fetched providerEntry from DB (using request providerId): ${JSON.stringify(providerEntry)}`,
    );

    if (!providerEntry) {
      this.logger.error('Provider does not exist');
      throw new BadRequestException('Provider does not exist');
    }

    // Check if provider is enabled or not
    if (providerEntry.isEnabled != IsEnabledStatus.TRUE) {
      this.logger.error(`Provider ${providerEntry.name} is not enabled`);
      throw new BadRequestException(`Provider ${providerEntry.name} is not enabled`);
    }

    const apiKeys = await this.serverApiKeysService.findByRelatedApplicationId(
      providerEntry.applicationId,
    );

    if (!apiKeys || apiKeys.length === 0) {
      this.logger.error('No API keys found for the application.');
      return false;
    }

    // Compare the provided API key with all stored API keys
    for (const apiKeyEntry of apiKeys) {
      const isMatch = await compareApiKeys(apiKeyToken, apiKeyEntry.apiKey);

      if (isMatch) {
        this.logger.debug('Valid API Key found for the application.');
        return true;
      }
    }

    return false;
  }
}

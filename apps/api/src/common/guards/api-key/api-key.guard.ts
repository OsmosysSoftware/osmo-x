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
import { ProviderChainsService } from 'src/modules/provider-chains/provider-chains.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly serverApiKeysService: ServerApiKeysService,
    private readonly providersService: ProvidersService,
    private readonly providerChainsService: ProviderChainsService,
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
      this.logger.debug('Fetching request header and provider related data for HTTP');
      const serverApiKeyHeader = request.headers['x-api-key'];
      const requestProviderId = request.body?.providerId ?? null;
      const requestProviderChainName = request.body?.providerChain ?? null;
      const validationResult = await this.validateApiKeyHeader(
        serverApiKeyHeader,
        requestProviderId,
        requestProviderChainName,
      );

      if (validationResult) {
        return true;
      }
    }

    // Get api key header incase of graphql request
    const ctx = GqlExecutionContext.create(execContext);
    const req = ctx.getContext().req;
    this.logger.debug('Fetching request header and provider related data for GraphQL');
    const serverApiKeyHeader = req.headers['x-api-key'];
    const requestProviderId = req.body?.providerId ?? null;
    const requestProviderChainName = req.body?.providerChain ?? null;
    const validationResult = await this.validateApiKeyHeader(
      serverApiKeyHeader,
      requestProviderId,
      requestProviderChainName,
    );

    if (validationResult) {
      return true;
    }

    throw new UnauthorizedException('Invalid API key');
  }

  async validateApiKeyHeader(
    serverApiKeyHeader: string,
    requestProviderId: number | null = null,
    requestProviderChainName: string | null = null,
  ): Promise<boolean> {
    this.logger.debug('validateApiKeyHeader started');
    let apiKeyToken = null;

    if (serverApiKeyHeader) {
      apiKeyToken = serverApiKeyHeader;
    } else {
      this.logger.error('Header x-api-key was not provided');
      throw new UnauthorizedException('Header x-api-key was not provided');
    }

    this.logger.debug(
      `Request providerId: ${requestProviderId}, Request providerChain: ${requestProviderChainName}`,
    );

    if (requestProviderId && requestProviderChainName) {
      this.logger.error('Set either providerId or providerChain, but not both in the same request');
      throw new BadRequestException(
        'Set either providerId or providerChain, but not both in the same request',
      );
    }

    // Fetch the applicationId that owns the providerId or providerChain
    const applicationIdFromRequestProvider =
      await this.fetchApplicationIdFromInputProviderIdOrProviderChain(
        requestProviderId,
        requestProviderChainName,
      );

    if (!applicationIdFromRequestProvider) {
      this.logger.error(
        `Could not fetch applicationId from Request providerId: ${requestProviderId}, Request providerChain: ${requestProviderChainName}`,
      );
      throw new BadRequestException('Invalid providerId or providerChain');
    }

    // Get API keys for application that owns the providerId or providerChain
    const apiKeys = await this.serverApiKeysService.findByRelatedApplicationId(
      applicationIdFromRequestProvider,
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

  async fetchApplicationIdFromInputProviderIdOrProviderChain(
    requestProviderId: number,
    requestProviderChainName: string,
  ): Promise<number | null> {
    if (requestProviderId && !requestProviderChainName) {
      // Get the provider entry from providerId
      const providerEntry = await this.providersService.getById(requestProviderId);
      this.logger.debug(
        `Fetched providerEntry from DB (using request providerId): ${JSON.stringify(providerEntry)}`,
      );

      if (!providerEntry) {
        this.logger.error('Provider does not exist');
        throw new BadRequestException('Provider does not exist');
      }

      // Check if provider is enabled or not
      if (providerEntry.isEnabled !== IsEnabledStatus.TRUE) {
        this.logger.error(`Provider ${providerEntry.name} is not enabled`);
        throw new BadRequestException(`Provider ${providerEntry.name} is not enabled`);
      }

      return providerEntry.applicationId;
    } else if (requestProviderChainName && !requestProviderId) {
      // Confirm the providerChain entry from providerChainName exists
      const providerChainEntry =
        await this.providerChainsService.getByProviderChainName(requestProviderChainName);
      this.logger.debug(
        `Fetched providerChainEntry from DB (using request providerChainName): ${JSON.stringify(providerChainEntry)}`,
      );

      if (!providerChainEntry) {
        this.logger.error('Provider Chain does not exist');
        throw new BadRequestException('Provider Chain does not exist');
      }

      return providerChainEntry.applicationId;
    }

    return null;
  }
}

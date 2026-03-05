import { Injectable } from '@nestjs/common';
import * as packageJson from '../package.json';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

@Injectable()
export class AppService {
  getHealthCheck(): Record<string, unknown> {
    return {
      status: 'ok',
      message: 'OsmoX API Server is running',
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      documentation: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/docs`,
      endpoints: {
        auth: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/auth`,
        applications: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/applications`,
        providers: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/providers`,
        master_providers: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/master-providers`,
        provider_chains: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/provider-chains`,
        provider_chain_members: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/provider-chain-members`,
        notifications: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/notifications`,
        archived_notifications: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/archived-notifications`,
        users: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/users`,
        api_keys: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/api-keys`,
        webhooks: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/webhooks`,
        organizations: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/organizations`,
        dashboard: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/dashboard`,
      },
      admin: {
        graphql: '/graphql',
        queue_notifications: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/notifications/queue`,
        confirm_notifications: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/notifications/confirm`,
        redis_cleanup: `${configService.getOrThrow('GLOBAL_API_PREFIX')}/notifications/redis/cleanup`,
        dozzle_logs: 'http://localhost:8080',
      },
    };
  }
}

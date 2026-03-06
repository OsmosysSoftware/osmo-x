import { Injectable } from '@nestjs/common';
import * as packageJson from '../package.json';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHealthCheck(): Record<string, unknown> {
    const prefix = this.configService.get('GLOBAL_API_PREFIX', '');

    return {
      status: 'ok',
      message: 'OsmoX API Server is running',
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      documentation: `${prefix}/docs`,
      endpoints: {
        auth: `${prefix}/auth`,
        applications: `${prefix}/applications`,
        providers: `${prefix}/providers`,
        master_providers: `${prefix}/master-providers`,
        provider_chains: `${prefix}/provider-chains`,
        provider_chain_members: `${prefix}/provider-chain-members`,
        notifications: `${prefix}/notifications`,
        archived_notifications: `${prefix}/archived-notifications`,
        users: `${prefix}/users`,
        api_keys: `${prefix}/api-keys`,
        webhooks: `${prefix}/webhooks`,
        organizations: `${prefix}/organizations`,
        dashboard: `${prefix}/dashboard`,
      },
      admin: {
        graphql: '/graphql',
        queue_notifications: `${prefix}/notifications/queue`,
        confirm_notifications: `${prefix}/notifications/confirm`,
        redis_cleanup: `${prefix}/notifications/redis/cleanup`,
        dozzle_logs: 'http://localhost:8080',
      },
    };
  }
}

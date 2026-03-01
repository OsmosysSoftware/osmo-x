import { Injectable } from '@nestjs/common';
import * as packageJson from '../package.json';

@Injectable()
export class AppService {
  getHealthCheck(): Record<string, unknown> {
    return {
      status: 'ok',
      message: 'OsmoX API Server is running',
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      documentation: '/api/docs',
      endpoints: {
        auth: '/api/auth',
        applications: '/api/applications',
        providers: '/api/providers',
        master_providers: '/api/master-providers',
        provider_chains: '/api/provider-chains',
        provider_chain_members: '/api/provider-chain-members',
        notifications: '/api/notifications',
        archived_notifications: '/api/archived-notifications',
        users: '/api/users',
        api_keys: '/api/api-keys',
        webhooks: '/api/webhooks',
        organizations: '/api/organizations',
        dashboard: '/api/dashboard',
      },
      admin: {
        graphql: '/graphql',
        queue_notifications: '/api/notifications/queue',
        confirm_notifications: '/api/notifications/confirm',
        redis_cleanup: '/api/notifications/redis/cleanup',
        dozzle_logs: 'http://localhost:8080',
      },
    };
  }
}

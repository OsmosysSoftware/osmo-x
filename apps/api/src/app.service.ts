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
        auth: '/api/v1/auth',
        applications: '/api/v1/applications',
        providers: '/api/v1/providers',
        master_providers: '/api/v1/master-providers',
        provider_chains: '/api/v1/provider-chains',
        notifications: '/api/v1/notifications',
        archived_notifications: '/api/v1/archived-notifications',
        users: '/api/v1/users',
        api_keys: '/api/v1/api-keys',
        webhooks: '/api/v1/webhooks',
        organizations: '/api/v1/organizations',
        dashboard: '/api/v1/dashboard',
      },
      admin: {
        graphql: '/graphql',
      },
    };
  }
}

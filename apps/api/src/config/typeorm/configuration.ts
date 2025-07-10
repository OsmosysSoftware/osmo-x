import { DataSource, DatabaseType, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';

config();

const configService = new ConfigService();

export default new DataSource({
  type: configService.getOrThrow<DatabaseType>('DB_TYPE'),
  host: configService.getOrThrow<string>('DB_HOST'),
  port: +configService.getOrThrow<number>('DB_PORT'),
  username: configService.getOrThrow<string>('DB_USERNAME'),
  password: configService.getOrThrow<string>('DB_PASSWORD'),
  database: configService.getOrThrow<string>('DB_NAME'),
  ssl:
    configService.getOrThrow<string>('DB_SSL_ENABLED') === 'true'
      ? {
          rejectUnauthorized:
            configService.getOrThrow<string>('DB_SSL_REJECT_UNAUTHORIZED') === 'true'
              ? true
              : false,
        }
      : false,
  entities: [],
  migrations: ['src/database/migrations/**'],
  migrationsTableName: 'notify_migrations',
  synchronize: false,
} as DataSourceOptions);

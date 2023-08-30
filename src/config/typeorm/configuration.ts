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
  entities: [],
  migrations: ['src/database/migrations/**'],
  synchronize: false,
} as DataSourceOptions);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { loggerConfig } from './config/logger.config';
import { JsendFormatter } from './common/jsend-formatter';
import { HttpExceptionFilter } from './common/http-exception.filter';

const logDir = 'logs';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const configService = new ConfigService();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: loggerConfig,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter(new JsendFormatter()));
  // TODO: Update origin as needed
  app.enableCors({ origin: '*', credentials: true });
  await app.listen(configService.getOrThrow('SERVER_PORT'));
}

bootstrap();

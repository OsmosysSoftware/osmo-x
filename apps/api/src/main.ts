import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { loggerConfig } from './config/logger.config';
import { ProblemJsonFilter } from './common/filters/problem-json.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as packageJson from '../package.json';
import { useContainer } from 'class-validator';
import { urlencoded, json } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { transformSwaggerToSnakeCase } from './common/utils/swagger-snake-case.transformer';

const logDir = 'logs';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const configService = new ConfigService();
const globalPrefix = configService.get('GLOBAL_API_PREFIX', '');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: loggerConfig,
  });
  // Enable qs-style deep-object query parsing so `?data_filter[key]=value` is parsed
  // into req.query.data_filter = { key: 'value' }. Express 5 defaults to 'simple'.
  app.set('query parser', 'extended');
  // used to inject services in validator decorators
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const config = new DocumentBuilder()
    .setTitle(packageJson.name)
    .setDescription(packageJson.description)
    .setVersion(packageJson.version)
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Dashboard', 'Dashboard statistics')
    .addTag('Applications', 'Application management')
    .addTag('Providers', 'Provider management')
    .addTag('Master Providers', 'Provider type catalog')
    .addTag('Provider Chains', 'Provider chain management')
    .addTag('Provider Chain Members', 'Provider chain member management')
    .addTag('Notifications', 'Notification management')
    .addTag('Archived Notifications', 'Archived notification management')
    .addTag('Users', 'User management')
    .addTag('API Keys', 'API key management')
    .addTag('Webhooks', 'Webhook management')
    .addTag('Organizations', 'Organization management')
    .build();
  let document = SwaggerModule.createDocument(app, config);
  document = transformSwaggerToSnakeCase(document);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);
  app.setGlobalPrefix(globalPrefix, {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: '/health', method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ProblemJsonFilter());
  app.use(json({ limit: configService.get('REQUEST_MAX_SIZE', '50mb') }));
  app.use(urlencoded({ extended: true, limit: configService.get('REQUEST_MAX_SIZE', '50mb') }));
  // TODO: Update origin as needed
  app.enableCors({ origin: '*', credentials: true });
  await app.listen(configService.getOrThrow('SERVER_PORT'));
}

bootstrap();

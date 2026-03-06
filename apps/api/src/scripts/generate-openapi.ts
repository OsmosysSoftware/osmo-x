/**
 * Generate OpenAPI JSON spec from NestJS application without starting the HTTP server.
 * Usage: npx ts-node -r tsconfig-paths/register src/scripts/generate-openapi.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { transformSwaggerToSnakeCase } from '../common/utils/swagger-snake-case.transformer';
import * as packageJson from '../../package.json';
import * as fs from 'fs';
import * as path from 'path';

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle(packageJson.name)
    .setDescription(packageJson.description)
    .setVersion(packageJson.version)
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();

  let document = SwaggerModule.createDocument(app, config);
  document = transformSwaggerToSnakeCase(document);

  const outputPath = path.resolve(__dirname, '../../openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

  // eslint-disable-next-line no-console
  console.log(`OpenAPI spec written to ${outputPath}`);

  await app.close();
}

generate();

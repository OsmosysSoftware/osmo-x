import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookService } from './webhook.service';
import { Webhook } from './entities/webhook.entity';
import { HttpModule } from '@nestjs/axios';
import { WebhookResolver } from './webhook.resolver';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ServerApiKeysModule } from '../server-api-keys/server-api-keys.module';

@Module({
  imports: [TypeOrmModule.forFeature([Webhook]), ServerApiKeysModule, HttpModule],
  providers: [WebhookService, WebhookResolver, Logger, ServerApiKeysService],
  exports: [WebhookService],
})
export class WebhookModule {}

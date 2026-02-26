import { forwardRef, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookService } from './webhook.service';
import { WebhookV1Controller } from './webhook-v1.controller';
import { Webhook } from './entities/webhook.entity';
import { HttpModule } from '@nestjs/axios';
import { WebhookResolver } from './webhook.resolver';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ServerApiKeysModule } from '../server-api-keys/server-api-keys.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook]),
    ServerApiKeysModule,
    HttpModule,
    JwtModule,
    forwardRef(() => NotificationsModule),
  ],
  providers: [WebhookService, WebhookResolver, Logger, ServerApiKeysService],
  controllers: [WebhookV1Controller],
  exports: [WebhookService],
})
export class WebhookModule {}

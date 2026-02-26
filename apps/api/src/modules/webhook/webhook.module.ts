import { forwardRef, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { Webhook } from './entities/webhook.entity';
import { HttpModule } from '@nestjs/axios';
import { WebhookResolver } from './webhook.resolver';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ServerApiKeysModule } from '../server-api-keys/server-api-keys.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtModule } from '@nestjs/jwt';
import { ProvidersModule } from '../providers/providers.module';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook]),
    ServerApiKeysModule,
    HttpModule,
    JwtModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => ProvidersModule),
    ApplicationsModule,
  ],
  providers: [WebhookService, WebhookResolver, Logger, ServerApiKeysService],
  controllers: [WebhookController],
  exports: [WebhookService],
})
export class WebhookModule {}

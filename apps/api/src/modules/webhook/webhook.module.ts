import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookService } from './webhook.service';
import { Webhook } from './entities/webhook.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Webhook]), HttpModule],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}

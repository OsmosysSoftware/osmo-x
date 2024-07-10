import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { Webhook } from './entities/webhook.entity';
import { Provider } from 'src/modules/providers/entities/provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Webhook, Provider])],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}

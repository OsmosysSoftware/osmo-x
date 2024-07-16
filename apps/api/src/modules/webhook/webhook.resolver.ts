import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { WebhookService } from './webhook.service';
import { Webhook } from './entities/webhook.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/api-key/auth.guard';
import { CreateWebhookInput } from './dto/create-webhook.input';

@Resolver(() => Webhook)
@UseGuards(AuthGuard)
export class WebhookResolver {
  constructor(private readonly webhookService: WebhookService) {}

  @Mutation(() => Webhook, { name: 'webhook' })
  async registerWebhook(
    @Args('createWebhookInput') createWebhookInput: CreateWebhookInput,
  ): Promise<Webhook> {
    try {
      return await this.webhookService.registerWebhook(createWebhookInput);
    } catch (error) {
      throw new Error(`Failed to register webhook: ${error.message}`);
    }
  }
}

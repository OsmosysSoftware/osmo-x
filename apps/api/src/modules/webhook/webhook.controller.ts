import { Controller, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('providers')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post(':providerId/webhooks')
  async registerWebhook(
    @Param('providerId') providerId: number,
    @Body('webhookUrl') webhookUrl: string,
  ): Promise<{ status: string; message: string }> {
    try {
      await this.webhookService.registerWebhook(providerId, webhookUrl);
      return { status: 'success', message: 'Webhook registered successfully.' };
    } catch (error) {
      console.error('Error registering webhook:', error);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from './entities/webhook.entity';
import { Notification } from '../notifications/entities/notification.entity';
import axios from 'axios';
import { CreateWebhookInput } from './dto/create-webhook.input';
import { Status } from 'src/common/constants/database';

@Injectable()
export class WebhookService {
  protected readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
  ) {}

  async registerWebhook(webhookInput: CreateWebhookInput): Promise<Webhook> {
    // Check if there is an active webhook with the same provider_id
    const existingWebhook = await this.webhookRepository.findOne({
      where: {
        providerId: webhookInput.providerId,
        status: Status.ACTIVE,
      },
    });

    if (existingWebhook) {
      throw new Error('This provider webhook exist');
    }

    const webhook = this.webhookRepository.create(webhookInput);
    return await this.webhookRepository.save(webhook);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async triggerWebhook(notification: Notification): Promise<void> {
    const maxRetries = 5;
    let attempts = 0;
    this.logger.log(
      `Triggering webhook for notification with providerId: ${notification.providerId}`,
    );

    while (attempts < maxRetries) {
      try {
        const webhook = await this.webhookRepository.findOneBy({
          providerId: notification.providerId,
          status: Status.ACTIVE,
        });

        if (!webhook) {
          this.logger.log(`Webhook not found for providerId: ${notification.providerId}`);
          break;
        }

        const response = await axios.post(webhook.webhookUrl, notification, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        this.logger.log('Webhook sent successfully:', response.data);
        return;
      } catch (error) {
        attempts++;
        this.logger.log(`Attempt ${attempts}: Webhook request failed: ${error.message}`);

        if (attempts >= maxRetries) {
          this.logger.log(`Failed to deliver webhook after multiple attempts`);
        }

        this.logger.log(`Exponential backoff: Waiting for ${attempts * 1000} milliseconds`);
        const waitTime = Math.pow(2, attempts) * 1000; // Exponential backoff

        await this.sleep(waitTime);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from './entities/webhook.entity';
import { Notification } from '../notifications/entities/notification.entity';
import axios from 'axios';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
  ) {}

  async registerWebhook(providerId: number, webhookUrl: string): Promise<void> {
    const webhook = new Webhook();
    webhook.providerId = providerId;
    webhook.webhookUrl = webhookUrl;

    await this.webhookRepository.save(webhook);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async triggerWebhook(notification: Notification): Promise<void> {
    const maxRetries = 5;
    let attempts = 0;

    console.log(`Triggering webhook for notification with providerId: ${notification.providerId}`);

    while (attempts < maxRetries) {
      try {
        const webhook = await this.webhookRepository.findOneBy({
          providerId: notification.providerId,
        });

        if (!webhook) {
          console.error(`Webhook not found for providerId: ${notification.providerId}`);
          break;
        }

        const response = await axios.post(webhook.webhookUrl, notification, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Webhook sent successfully:', response.data);
        return;
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts}: Webhook request failed: ${error.message}`);

        if (attempts >= maxRetries) {
          console.error(`Failed to deliver webhook after multiple attempts`);
        }

        console.log(`Exponential backoff: Waiting for ${attempts * 1000} milliseconds`);
        const waitTime = Math.pow(2, attempts) * 1000; // Exponential backoff

        await this.sleep(waitTime);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

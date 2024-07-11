import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from './entities/webhook.entity';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    private readonly httpService: HttpService,
  ) {}

  async registerWebhook(providerId: number, webhookUrl: string): Promise<void> {
    const webhook = this.webhookRepository.create({ providerId, webhookUrl });
    await this.webhookRepository.save(webhook);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async triggerWebhook(webhookUrl: string, data: any): Promise<void> {
    const maxRetries = 5;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        await this.httpService.post(webhookUrl, data).toPromise();
        return;
      } catch (error) {
        attempts++;
        console.error(`Webhook attempt ${attempts} failed: ${error.message}`);

        if (attempts >= maxRetries) {
          throw new HttpException(
            'Failed to deliver webhook after multiple attempts',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        await this.sleep(attempts * 1000); // Exponential backoff
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

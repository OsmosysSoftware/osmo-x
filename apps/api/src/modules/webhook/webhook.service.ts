import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConflictException, NotFoundException } from 'src/common/exceptions/app.exception';
import { ErrorCodes } from 'src/common/constants/error-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Webhook } from './entities/webhook.entity';
import axios from 'axios';
import { CreateWebhookInput } from './dto/create-webhook.input';
import { UpdateWebhookInput } from './dto/update-webhook.input';
import { Status } from 'src/common/constants/database';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { ProvidersService } from '../providers/providers.service';
import { ApplicationsService } from '../applications/applications.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginationHelper, PaginationMeta } from 'src/common/utils/pagination.helper';

@Injectable()
export class WebhookService {
  protected readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @Inject(forwardRef(() => NotificationsService))
    protected readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => ProvidersService))
    private readonly providersService: ProvidersService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async findByProviderId(providerId: number): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { providerId, status: Status.ACTIVE },
    });
  }

  async registerWebhook(webhookInput: CreateWebhookInput): Promise<Webhook> {
    // Check if there is an active webhook with the same provider_id
    const existingWebhook = await this.webhookRepository.findOne({
      where: {
        providerId: webhookInput.providerId,
        status: Status.ACTIVE,
      },
    });

    if (existingWebhook) {
      throw new ConflictException(
        ErrorCodes.GENERAL_CONFLICT,
        'A webhook already exists for this provider',
      );
    }

    const webhook = this.webhookRepository.create(webhookInput);
    return await this.webhookRepository.save(webhook);
  }

  async triggerWebhook(id: number): Promise<void> {
    const maxRetries = 5;
    let attempts = 0;
    const notification = (await this.notificationsService.getNotificationById(id))[0];
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

  private mapToDto(webhook: Webhook): WebhookResponseDto {
    return {
      id: webhook.id,
      providerId: webhook.providerId,
      webhookUrl: webhook.webhookUrl,
      isVerified: webhook.isVerified,
      status: webhook.status,
      createdBy: webhook.createdBy,
      updatedBy: webhook.updatedBy,
      createdOn: webhook.createdOn,
      updatedOn: webhook.updatedOn,
    };
  }

  async getAllWebhooksAsDto(
    query: PaginationQueryDto,
    organizationId: number,
  ): Promise<{ items: WebhookResponseDto[]; meta: PaginationMeta }> {
    const appIds = await this.applicationsService.getApplicationIdsByOrganization(organizationId);

    if (appIds.length === 0) {
      const { page, limit } = PaginationHelper.normalizePaginationParams(query);

      return { items: [], meta: PaginationHelper.buildPaginationMeta(page, limit, 0) };
    }

    const providerIds = await this.getProviderIdsByApplicationIds(appIds);

    if (providerIds.length === 0) {
      const { page, limit } = PaginationHelper.normalizePaginationParams(query);

      return { items: [], meta: PaginationHelper.buildPaginationMeta(page, limit, 0) };
    }

    const { page, limit, offset, sort } = PaginationHelper.normalizePaginationParams(query);
    const [webhooks, total] = await this.webhookRepository.findAndCount({
      where: { providerId: In(providerIds), status: Status.ACTIVE },
      order: sort ? { [sort.field]: sort.order } : { id: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      items: webhooks.map((w) => this.mapToDto(w)),
      meta: PaginationHelper.buildPaginationMeta(page, limit, total),
    };
  }

  private async getProviderIdsByApplicationIds(appIds: number[]): Promise<number[]> {
    const providers = await this.providersService.findByApplicationIds(appIds);

    return providers.map((p) => p.providerId);
  }

  async findByProviderIdAsDto(
    providerId: number,
    organizationId: number,
  ): Promise<WebhookResponseDto[]> {
    const provider = await this.providersService.getById(providerId);

    if (!provider) {
      throw new NotFoundException(ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
    }

    const app = await this.applicationsService.findById(provider.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new NotFoundException(ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
    }

    const webhooks = await this.findByProviderId(providerId);

    return webhooks.map((webhook) => this.mapToDto(webhook));
  }

  private async verifyWebhookOrgAccess(
    webhookId: number,
    organizationId: number,
  ): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id: webhookId, status: Status.ACTIVE },
    });

    if (!webhook) {
      throw new NotFoundException(ErrorCodes.WEBHOOK_NOT_FOUND, 'Webhook not found');
    }

    const provider = await this.providersService.getById(webhook.providerId);

    if (!provider) {
      throw new NotFoundException(ErrorCodes.WEBHOOK_NOT_FOUND, 'Webhook not found');
    }

    const app = await this.applicationsService.findById(provider.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new NotFoundException(ErrorCodes.WEBHOOK_NOT_FOUND, 'Webhook not found');
    }

    return webhook;
  }

  async updateWebhookAsDto(
    input: UpdateWebhookInput,
    organizationId: number,
  ): Promise<WebhookResponseDto> {
    const webhook = await this.verifyWebhookOrgAccess(input.id, organizationId);
    webhook.webhookUrl = input.webhookUrl;
    const saved = await this.webhookRepository.save(webhook);

    return this.mapToDto(saved);
  }

  async softDeleteWebhookAsDto(webhookId: number, organizationId: number): Promise<boolean> {
    const webhook = await this.verifyWebhookOrgAccess(webhookId, organizationId);
    webhook.status = Status.INACTIVE;
    await this.webhookRepository.save(webhook);

    return true;
  }

  async registerWebhookAsDto(
    webhookInput: CreateWebhookInput,
    organizationId: number,
  ): Promise<WebhookResponseDto> {
    const provider = await this.providersService.getById(webhookInput.providerId);

    if (!provider) {
      throw new NotFoundException(ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
    }

    const app = await this.applicationsService.findById(provider.applicationId);

    if (!app || app.organizationId !== organizationId) {
      throw new NotFoundException(ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
    }

    const webhook = await this.registerWebhook(webhookInput);

    return this.mapToDto(webhook);
  }
}

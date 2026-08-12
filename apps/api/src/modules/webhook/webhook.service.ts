import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConflictException, NotFoundException } from 'src/common/exceptions/app.exception';
import { ErrorCodes } from 'src/common/constants/error-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Webhook } from './entities/webhook.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import axios from 'axios';
import ms = require('ms');
import { ConfigService } from '@nestjs/config';
import { CreateWebhookInput } from './dto/create-webhook.input';
import { UpdateWebhookInput } from './dto/update-webhook.input';
import { Status } from 'src/common/constants/database';
import { WebhookDeliveryStatus } from './constants/webhook-delivery-status';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { WebhookLogResponseDto } from './dto/webhook-log-response.dto';
import { ProvidersService } from '../providers/providers.service';
import { ApplicationsService } from '../applications/applications.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginationHelper, PaginationMeta } from 'src/common/utils/pagination.helper';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';

@Injectable()
export class WebhookService {
  protected readonly logger = new Logger(WebhookService.name);
  private readonly maxRetryCount: number;
  private readonly retryIntervalMs: number;
  private readonly requestTimeoutMs: number;

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepository: Repository<WebhookLog>,
    @Inject(forwardRef(() => NotificationsService))
    protected readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => ProvidersService))
    private readonly providersService: ProvidersService,
    private readonly applicationsService: ApplicationsService,
    @Inject(forwardRef(() => NotificationQueueProducer))
    private readonly notificationQueueProducer: NotificationQueueProducer,
    private readonly configService: ConfigService,
  ) {
    const maxRetryCountRaw = +this.configService.get('WEBHOOK_MAX_RETRY_COUNT', 5);

    if (Number.isInteger(maxRetryCountRaw) && maxRetryCountRaw >= 1) {
      this.maxRetryCount = maxRetryCountRaw;
    } else {
      this.logger.warn(
        `Invalid WEBHOOK_MAX_RETRY_COUNT value: ${maxRetryCountRaw}, falling back to default of 5`,
      );
      this.maxRetryCount = 5;
    }

    const retryIntervalRaw = ms(this.configService.get<string>('WEBHOOK_RETRY_INTERVAL', '30m'));

    if (Number.isFinite(retryIntervalRaw) && retryIntervalRaw > 0) {
      this.retryIntervalMs = retryIntervalRaw;
    } else {
      this.logger.warn(`Invalid WEBHOOK_RETRY_INTERVAL value, falling back to default of 30m`);
      this.retryIntervalMs = ms('30m');
    }

    const requestTimeoutRaw = +this.configService.get('WEBHOOK_REQUEST_TIMEOUT_MS', 10000);

    if (Number.isInteger(requestTimeoutRaw) && requestTimeoutRaw > 0) {
      this.requestTimeoutMs = requestTimeoutRaw;
    } else {
      this.logger.warn(
        `Invalid WEBHOOK_REQUEST_TIMEOUT_MS value: ${requestTimeoutRaw}, falling back to default of 10000`,
      );
      this.requestTimeoutMs = 10000;
    }
  }

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

  async triggerWebhook(id: number, attempt: number = 1): Promise<void> {
    const notification = (await this.notificationsService.getNotificationById(id))[0];
    this.logger.log(
      `Triggering webhook for notification with providerId: ${notification.providerId}, attempt ${attempt}/${this.maxRetryCount}`,
    );

    const webhook = await this.webhookRepository.findOneBy({
      providerId: notification.providerId,
      status: Status.ACTIVE,
    });

    if (!webhook) {
      this.logger.log(`Webhook not found for providerId: ${notification.providerId}`);
      return;
    }

    const requestedAt = new Date();

    try {
      const response = await axios.post(webhook.webhookUrl, notification, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: this.requestTimeoutMs,
      });

      this.logger.log(`Webhook delivered successfully for notification ${id}`);
      await this.saveWebhookLog(webhook.id, id, attempt, WebhookDeliveryStatus.SUCCESS, {
        requestBody: notification,
        httpStatusCode: response.status,
        responseBody: response.data,
        requestedAt,
      });
      await this.updateLastDelivery(webhook, WebhookDeliveryStatus.SUCCESS, requestedAt);
    } catch (error) {
      const httpStatusCode: number | null = error.response?.status ?? null;
      const responseBody: unknown = error.response?.data ?? null;
      const errorMessage: string = error.message;

      if (attempt < this.maxRetryCount) {
        this.logger.log(
          `Webhook delivery failed for notification ${id}, attempt ${attempt}/${this.maxRetryCount}: ${errorMessage}. Retrying in ${this.retryIntervalMs}ms`,
        );
        await this.saveWebhookLog(webhook.id, id, attempt, WebhookDeliveryStatus.RETRYING, {
          requestBody: notification,
          httpStatusCode,
          responseBody,
          errorMessage,
          requestedAt,
        });
        await this.updateLastDelivery(webhook, WebhookDeliveryStatus.RETRYING, requestedAt);
        await this.notificationQueueProducer.enqueueDelayedWebhookRetry(
          notification,
          attempt + 1,
          this.retryIntervalMs,
        );
      } else {
        this.logger.error(
          `Webhook delivery permanently failed for notification ${id} after ${attempt} attempts: ${errorMessage}`,
        );
        await this.saveWebhookLog(webhook.id, id, attempt, WebhookDeliveryStatus.FAILED, {
          requestBody: notification,
          httpStatusCode,
          responseBody,
          errorMessage,
          requestedAt,
        });
        await this.updateLastDelivery(webhook, WebhookDeliveryStatus.FAILED, requestedAt);
      }
    }
  }

  private truncateForStorage(data: unknown): unknown {
    if (data === undefined || data === null) {
      return null;
    }

    const maxLength = 10000;
    const serialized = JSON.stringify(data);

    if (serialized.length <= maxLength) {
      return data;
    }

    return { truncated: true, preview: serialized.slice(0, maxLength) };
  }

  private async saveWebhookLog(
    webhookId: number,
    notificationId: number,
    attemptNumber: number,
    status: number,
    details: {
      requestBody?: unknown;
      httpStatusCode?: number | null;
      responseBody?: unknown;
      errorMessage?: string | null;
      requestedAt: Date;
    },
  ): Promise<void> {
    await this.webhookLogRepository.save({
      webhookId,
      notificationId,
      attemptNumber,
      status,
      requestBody: this.truncateForStorage(details.requestBody),
      httpStatusCode: details.httpStatusCode ?? null,
      responseBody: this.truncateForStorage(details.responseBody),
      errorMessage: details.errorMessage ?? null,
      requestedAt: details.requestedAt,
    });
  }

  private async updateLastDelivery(
    webhook: Webhook,
    status: number,
    attemptedAt: Date,
  ): Promise<void> {
    // Only overwrite if this attempt is newer than what's stored, so a slower older attempt
    // can't clobber a faster, more recent one when webhook calls for the same provider
    // complete out of order.
    await this.webhookRepository
      .createQueryBuilder()
      .update(Webhook)
      .set({ lastDeliveryStatus: status, lastAttemptedAt: attemptedAt })
      .where('id = :id AND (last_attempted_at IS NULL OR last_attempted_at < :attemptedAt)', {
        id: webhook.id,
        attemptedAt,
      })
      .execute();
  }

  async deleteOldWebhookLogsCron(): Promise<void> {
    const retentionDaysRaw = this.configService.get<string>('WEBHOOK_LOG_RETENTION_DAYS', '');

    if (!retentionDaysRaw) {
      this.logger.log('WEBHOOK_LOG_RETENTION_DAYS not set, skipping webhook log cleanup');
      return;
    }

    const retentionDays = Number(retentionDaysRaw);

    if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
      this.logger.warn(
        `Invalid WEBHOOK_LOG_RETENTION_DAYS value: ${retentionDaysRaw}, skipping webhook log cleanup`,
      );
      return;
    }

    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await this.webhookLogRepository
      .createQueryBuilder()
      .delete()
      .where('created_on < :cutoff', { cutoff })
      .execute();

    this.logger.log(
      `Deleted ${result.affected ?? 0} webhook log rows older than ${retentionDays} days`,
    );
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
      lastDeliveryStatus: webhook.lastDeliveryStatus,
      lastAttemptedAt: webhook.lastAttemptedAt,
    };
  }

  private mapLogToDto(log: WebhookLog): WebhookLogResponseDto {
    return {
      id: log.id,
      webhookId: log.webhookId,
      notificationId: log.notificationId,
      attemptNumber: log.attemptNumber,
      status: log.status,
      httpStatusCode: log.httpStatusCode,
      requestBody: log.requestBody,
      responseBody: log.responseBody,
      errorMessage: log.errorMessage,
      requestedAt: log.requestedAt,
      createdOn: log.createdOn,
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

  async getWebhookLogsAsDto(
    webhookId: number,
    query: PaginationQueryDto,
    organizationId: number,
  ): Promise<{ items: WebhookLogResponseDto[]; meta: PaginationMeta }> {
    await this.verifyWebhookOrgAccess(webhookId, organizationId);

    const { page, limit, offset, sort } = PaginationHelper.normalizePaginationParams(query);
    const [logs, total] = await this.webhookLogRepository.findAndCount({
      where: { webhookId },
      order: sort ? { [sort.field]: sort.order } : { id: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      items: logs.map((log) => this.mapLogToDto(log)),
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

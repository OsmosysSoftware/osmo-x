import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import {
  DeliveryStatus,
  SortOrder,
  generateEnabledChannelEnum,
} from 'src/common/constants/notifications';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { Status } from 'src/common/constants/database';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { ConfigService } from '@nestjs/config';
import { QueryOptionsDto } from './dtos/query-options.dto';
import { NotificationResponse } from './dtos/notification-response.dto';

@Injectable()
export class NotificationsService {
  private isProcessingQueue: boolean = false;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationQueueService: NotificationQueueProducer,
    private readonly configService: ConfigService,
  ) {}

  async createNotification(notificationData: CreateNotificationDto): Promise<Notification> {
    this.logger.log('Creating notification...');
    const notification = new Notification(notificationData);
    const enabledChannels = generateEnabledChannelEnum(this.configService);
    const channelEnabled = Object.values(enabledChannels).includes(notification.channelType);

    if (!channelEnabled) {
      throw new BadRequestException(`Channel ${notification.channelType} is not enabled`);
    }

    notification.createdBy = this.configService.getOrThrow<string>('APP_NAME') || 'osmo_notify';
    notification.updatedBy = this.configService.getOrThrow<string>('APP_NAME') || 'osmo_notify';
    return this.notificationRepository.save(notification);
  }

  async addNotificationsToQueue(): Promise<void> {
    this.logger.log('Starting CRON job to add pending notifications to queue');

    if (this.isProcessingQueue) {
      this.logger.log('Notifications are already being added to queue, skipping this CRON job');
      return;
    }

    this.isProcessingQueue = true;
    let allPendingNotifications = [];

    try {
      allPendingNotifications = await this.getPendingNotifications();
    } catch (error) {
      this.isProcessingQueue = false;
      this.logger.error('Error fetching pending notifications');
      this.logger.error(JSON.stringify(error, null, 2));
      return;
    }

    const enabledChannels = generateEnabledChannelEnum(this.configService);
    const pendingNotifications = allPendingNotifications.filter((notification) =>
      Object.values(enabledChannels).includes(notification.channelType),
    );
    this.logger.log(`Adding ${pendingNotifications.length} pending notifications to queue`);

    for (const notification of pendingNotifications) {
      try {
        notification.deliveryStatus = DeliveryStatus.IN_PROGRESS;
        await this.notificationQueueService.addNotificationToQueue(notification);
      } catch (error) {
        notification.deliveryStatus = DeliveryStatus.PENDING;
        notification.result = { result: error };
        this.logger.error(`Error adding notification with id: ${notification.id} to queue`);
        this.logger.error(JSON.stringify(error, null, 2));
      } finally {
        await this.notificationRepository.save(notification);
      }
    }

    this.isProcessingQueue = false;
  }

  getPendingNotifications(): Promise<Notification[]> {
    this.logger.log('Getting all active pending notifications');
    return this.notificationRepository.find({
      where: {
        deliveryStatus: DeliveryStatus.PENDING,
        status: Status.ACTIVE,
      },
    });
  }

  getNotificationById(id: number): Promise<Notification[]> {
    this.logger.log(`Getting notification with id: ${id}`);
    return this.notificationRepository.find({
      where: {
        id: id,
        status: Status.ACTIVE,
      },
    });
  }
  async getAllNotifications(options: QueryOptionsDto): Promise<NotificationResponse> {
    this.logger.log('Getting all active notifications with options');

    const queryBuilder = this.notificationRepository.createQueryBuilder('notification');

    // Base where condition
    queryBuilder.where('notification.status = :status', { status: Status.ACTIVE });

    // Search functionality using OR condition
    if (options.search) {
      const searchableFields = ['createdBy', 'data', 'result'];
      queryBuilder.andWhere(
        new Brackets((qb) => {
          searchableFields.forEach((field, index) => {
            const condition = `notification.${field} LIKE :search`;

            if (index === 0) {
              qb.where(condition, { search: `%${options.search}%` });
            } else {
              qb.orWhere(condition, { search: `%${options.search}%` });
            }
          });
        }),
      );
    }

    // Applying filters
    let filterIndex = 0;
    options.filters?.forEach((filter) => {
      const field = filter.field;
      const value = filter.value;
      const condition = `notification.${field}`;
      const paramName = `value${filterIndex}`; // Unique parameter name issue: https://github.com/typeorm/typeorm/issues/3428

      switch (filter.operator) {
        case 'eq':
          queryBuilder.andWhere(`${condition} = :${paramName}`, { [paramName]: value });
          break;
        case 'contains':
          if (typeof value === 'string') {
            queryBuilder.andWhere(`${condition} LIKE :${paramName}`, { [paramName]: `%${value}%` });
          }

          break;
        case 'gt':
          queryBuilder.andWhere(`${condition} > :${paramName}`, {
            [paramName]: this.isDateField(filter.field) ? new Date(String(value)) : value,
          });
          break;
        case 'lt':
          queryBuilder.andWhere(`${condition} < :${paramName}`, {
            [paramName]: this.isDateField(filter.field) ? new Date(String(value)) : value,
          });
          break;
        case 'ne':
          queryBuilder.andWhere(`${condition} != :${paramName}`, { [paramName]: value });
          break;
      }

      filterIndex++;
    });

    // Pagination and Sorting
    if (options.offset !== undefined) {
      queryBuilder.skip(options.offset);
    }

    if (options.limit !== undefined) {
      queryBuilder.take(options.limit);
    }

    if (options.sortBy) {
      queryBuilder.addOrderBy(
        `notification.${options.sortBy}`,
        options.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC',
      );
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return { notifications, total, offset: options.offset, limit: options.limit };
  }

  // Helper method to check if a field is a date field
  private isDateField(field: string): boolean {
    // List all date fields from your Notification entity
    const dateFields = ['createdOn', 'updatedOn'];
    return dateFields.includes(field);
  }
}

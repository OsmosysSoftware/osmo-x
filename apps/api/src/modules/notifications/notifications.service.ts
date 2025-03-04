import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { DeliveryStatus, QueueAction } from 'src/common/constants/notifications';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { Status } from 'src/common/constants/database';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { NotificationResponse } from './dtos/notification-response.dto';
import { CoreService } from 'src/common/graphql/services/core.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ApplicationsService } from '../applications/applications.service';
import { ProvidersService } from '../providers/providers.service';
import { RetryNotification } from './entities/retry-notification.entity';

@Injectable()
export class NotificationsService extends CoreService<Notification> {
  protected readonly logger = new Logger(NotificationsService.name);
  private isProcessingQueue: boolean = false;
  private isProcessingConfirmationQueue: boolean = false;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RetryNotification)
    private readonly retryNotificationRepository: Repository<RetryNotification>,
    private readonly notificationQueueService: NotificationQueueProducer,
    private readonly applicationsService: ApplicationsService,
    private readonly providersService: ProvidersService,
  ) {
    super(notificationRepository);
  }

  async createNotification(notificationData: CreateNotificationDto): Promise<Notification> {
    this.logger.log('Creating notification...');

    // ApiKeyGuard validates the provider and application details
    const providerEntry = await this.providersService.getById(notificationData.providerId);
    const notification = new Notification(notificationData);

    // Get channel type and applicationId from providerId & set the values
    notification.channelType = providerEntry.channelType;
    notification.applicationId = providerEntry.applicationId;

    // Set correct application name using applicationId
    notification.createdBy = await this.getApplicationNameFromId(notification.applicationId);
    notification.updatedBy = await this.getApplicationNameFromId(notification.applicationId);
    this.logger.debug(
      `New Notification created. Saving notification in DB: ${JSON.stringify(notification)}`,
    );
    return this.notificationRepository.save(notification);
  }

  // Get correct application name using applicationId
  async getApplicationNameFromId(applicationId: number): Promise<string> {
    try {
      const applicationEntry = await this.applicationsService.findById(applicationId);

      if (!applicationEntry || !applicationEntry.name) {
        throw new Error('Related Application does not exist');
      }

      return applicationEntry.name;
    } catch (error) {
      this.logger.log('Error creating notification:', error.message);
      throw error;
    }
  }

  async addNotificationsToQueue(): Promise<void> {
    this.logger.log('Starting CRON job to add pending notifications to queue');

    this.logger.debug(`isProcessingQueue value: ${this.isProcessingQueue}`);

    if (this.isProcessingQueue) {
      this.logger.log('Notifications are already being added to queue, skipping this CRON job');
      return;
    }

    this.isProcessingQueue = true;
    this.logger.debug(
      `isProcessingQueue value before initializing allPendingNotifications: ${this.isProcessingQueue}`,
    );
    let allPendingNotifications: Notification[] = [];

    try {
      allPendingNotifications = await this.getPendingNotifications();
    } catch (error) {
      this.isProcessingQueue = false;
      this.logger.error('Error fetching pending notifications');
      this.logger.error(JSON.stringify(error, null, 2));
      this.logger.debug(
        `isProcessingQueue value when error fetching pending notifications: ${this.isProcessingQueue}`,
      );

      return;
    }

    this.logger.log(`Adding ${allPendingNotifications.length} pending notifications to queue`);

    for (const notification of allPendingNotifications) {
      try {
        this.logger.debug(
          `NotificationId: ${notification.id}, DeliveryStatus: ${notification.deliveryStatus}`,
        );
        notification.deliveryStatus = DeliveryStatus.IN_PROGRESS;
        this.logger.debug(
          `Updated deliveryStatus to ${DeliveryStatus.IN_PROGRESS}. Saving notification in DB: ${JSON.stringify(notification)}`,
        );
        await this.notificationRepository.save(notification);
        await this.notificationQueueService.addNotificationToQueue(QueueAction.SEND, notification);
      } catch (error) {
        this.logger.debug(
          `Error encountered. NotificationId: ${notification.id}, DeliveryStatus: ${notification.deliveryStatus}`,
        );
        notification.deliveryStatus = DeliveryStatus.PENDING;
        this.logger.debug(`Updating result of notification with id ${notification.id}`);
        notification.result = { result: { message: error.message, stack: error.stack } };

        await this.createRetryEntry(notification, error.message, error.stack);

        this.logger.error(`Error adding notification with id: ${notification.id} to queue`);
        this.logger.error(JSON.stringify(error, null, 2));
        this.logger.debug(
          `isProcessingQueue value while adding notification with id: ${notification.id} to queue: ${this.isProcessingQueue}`,
        );
      } finally {
        this.logger.debug(`Saving notification in DB: ${JSON.stringify(notification)}`);
        await this.notificationRepository.save(notification);
      }
    }

    this.isProcessingQueue = false;
    this.logger.debug(
      `isProcessingQueue value after adding ${allPendingNotifications.length} pending notifications to queue: ${this.isProcessingQueue}`,
    );
  }

  async getProviderConfirmation(): Promise<void> {
    this.logger.log(
      'Starting CRON job to add notifications to queue for confirmation from provider',
    );

    this.logger.debug(`isProcessingConfirmationQueue value: ${this.isProcessingConfirmationQueue}`);

    if (this.isProcessingConfirmationQueue) {
      this.logger.log(
        'Notifications are already being added to confirmation queue, skipping this CRON job',
      );
      return;
    }

    this.isProcessingConfirmationQueue = true;
    this.logger.debug(
      `isProcessingConfirmationQueue value before initializing allAwaitingConfirmationNotifications: ${this.isProcessingConfirmationQueue}`,
    );
    let allAwaitingConfirmationNotifications: Notification[] = [];

    try {
      allAwaitingConfirmationNotifications = await this.getAwaitingConfirmationNotifications();
    } catch (error) {
      this.isProcessingConfirmationQueue = false;
      this.logger.error('Error fetching awaiting confirmation notifications');
      this.logger.error(JSON.stringify(error, null, 2));
      this.logger.debug(
        `isProcessingConfirmationQueue value when error fetching awaiting confirmation notifications: ${this.isProcessingConfirmationQueue}`,
      );
      return;
    }

    this.logger.log(
      `Adding ${allAwaitingConfirmationNotifications.length} awaiting confirmation notifications to queue`,
    );

    for (const notification of allAwaitingConfirmationNotifications) {
      try {
        this.logger.debug(
          `NotificationId: ${notification.id}, DeliveryStatus: ${notification.deliveryStatus}`,
        );
        notification.deliveryStatus = DeliveryStatus.QUEUED_CONFIRMATION;
        this.logger.debug(
          `Updated deliveryStatus to ${DeliveryStatus.QUEUED_CONFIRMATION}. Saving notification in DB: ${JSON.stringify(notification)}`,
        );
        await this.notificationRepository.save(notification);
        await this.notificationQueueService.addNotificationToQueue(
          QueueAction.DELIVERY_STATUS,
          notification,
        );
      } catch (error) {
        this.logger.debug(
          `Error encountered. NotificationId: ${notification.id}, DeliveryStatus: ${notification.deliveryStatus}`,
        );
        notification.deliveryStatus = DeliveryStatus.AWAITING_CONFIRMATION;
        this.logger.error(`Error adding notification with id: ${notification.id} to queue`);
        this.logger.error(JSON.stringify(error, null, 2));
        this.logger.debug(
          `isProcessingConfirmationQueue value while adding notification with id: ${notification.id} to queue: ${this.isProcessingConfirmationQueue}`,
        );
        this.logger.debug(
          `Updated Delivery status to ${DeliveryStatus.AWAITING_CONFIRMATION}. Saving notification in DB: ${JSON.stringify(notification)}`,
        );
        await this.notificationRepository.save(notification);
      }
    }

    this.isProcessingConfirmationQueue = false;
    this.logger.debug(
      `isProcessingConfirmationQueue value after adding ${allAwaitingConfirmationNotifications.length} awaiting confirmation notifications to queue: ${this.isProcessingConfirmationQueue}`,
    );
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

  getAwaitingConfirmationNotifications(): Promise<Notification[]> {
    this.logger.log('Getting all awaiting confirmation notifications');
    return this.notificationRepository.find({
      where: {
        deliveryStatus: DeliveryStatus.AWAITING_CONFIRMATION,
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
    this.logger.log('Getting all notifications with options.');

    const baseConditions = [{ field: 'status', value: Status.ACTIVE }];
    const searchableFields = ['createdBy', 'data', 'result'];

    const { items, total } = await super.findAll(
      options,
      'notification',
      searchableFields,
      baseConditions,
    );
    return new NotificationResponse(items, total, options.offset, options.limit);
  }

  async createRetryEntry(
    notification: Notification,
    message: string,
    stack: string,
  ): Promise<void> {
    const retryEntry = new RetryNotification();
    retryEntry.notification = notification;
    retryEntry.notification_id = notification.id;
    retryEntry.retryCount = (notification.retries ? notification.retries.length : 0) + 1;
    retryEntry.retryResult = JSON.stringify({ message, stack });
    retryEntry.status = 1; // Assuming 1 means active

    await this.retryNotificationRepository.save(retryEntry);
  }
}

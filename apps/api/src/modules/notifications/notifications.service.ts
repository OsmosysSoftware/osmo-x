import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import {
  DeliveryStatus,
  QueueAction,
  RecipientKeyForChannelType,
} from 'src/common/constants/notifications';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { IsEnabledStatus, Status } from 'src/common/constants/database';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { NotificationResponse } from './dtos/notification-response.dto';
import { CoreService } from 'src/common/graphql/services/core.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ApplicationsService } from '../applications/applications.service';
import { ProvidersService } from '../providers/providers.service';
import { RetryNotification } from './entities/retry-notification.entity';
import { TEST_MODE_RESULT_JSON } from 'src/common/constants/miscellaneous';
import { Application } from '../applications/entities/application.entity';

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
    private readonly serverApiKeysService: ServerApiKeysService,
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

    // Fetch application details using applicationId
    const applicationEntry = await this.fetchApplicationEntryFromId(notification.applicationId);

    // Set correct application name
    notification.createdBy = applicationEntry.name;
    notification.updatedBy = applicationEntry.name;

    // Handle notification creation when application is in Test Mode
    if ((await this.checkApplicationIsInTestMode(applicationEntry)) === true) {
      this.logger.log('Application is in test mode.');

      if ((await this.checkRecipientIsWhitelisted(notification, applicationEntry)) === false) {
        this.logger.log('Recipient is not whitelisted. Notification will not be processed.');
        notification.deliveryStatus = DeliveryStatus.SUCCESS;
        notification.result = TEST_MODE_RESULT_JSON;
      } else {
        this.logger.log('Recipient is whitelisted. Notification will be prepared for processing.');
      }
    }

    this.logger.debug(
      `New Notification created. Saving notification in DB: ${JSON.stringify(notification)}`,
    );
    return this.notificationRepository.save(notification);
  }

  // Get correct applicationId using authorization header
  async getApplicationIdFromApiKey(authHeader: Request): Promise<number> {
    try {
      const bearerToken = authHeader.toString();
      const apiKeyToken = bearerToken.substring(7);

      if (apiKeyToken == null) {
        throw new Error('Failed to assign applicationId');
      }

      const apiKeyEntry = await this.serverApiKeysService.findByServerApiKey(apiKeyToken);

      if (!apiKeyEntry || !apiKeyEntry.applicationId) {
        throw new Error('Related Api Key does not exist');
      }

      return apiKeyEntry.applicationId;
    } catch (error) {
      this.logger.log('Error creating notification:', error.message);
      throw error;
    }
  }

  // Get application details using applicationId
  async fetchApplicationEntryFromId(applicationId: number): Promise<Application> {
    try {
      const applicationEntry = await this.applicationsService.findById(applicationId);

      if (!applicationEntry || !applicationEntry.name) {
        throw new Error('Related Application does not exist');
      }

      return applicationEntry;
    } catch (error) {
      throw new Error(`Error fetching application: ${error}`);
    }
  }

  async checkApplicationIsInTestMode(applicationEntry: Application): Promise<boolean> {
    try {
      return applicationEntry.testModeEnabled === IsEnabledStatus.TRUE;
    } catch (error) {
      this.logger.log('Error verifying test mode for notification:', error.message);
      throw error;
    }
  }

  // Function to check if request body has any whitelisted recipients
  async checkRecipientIsWhitelisted(
    notificationEntry: Notification,
    applicationEntry: Application,
  ): Promise<boolean> {
    try {
      if (
        applicationEntry.whitelistRecipients &&
        applicationEntry.whitelistRecipients[notificationEntry.providerId.toString()]
      ) {
        this.logger.debug(`Whitelist exists for provider ${notificationEntry.providerId}`);

        // Fetch whitelist whitelist recipients from db
        const whitelistRecipientValues =
          applicationEntry.whitelistRecipients[notificationEntry.providerId.toString()];
        this.logger.debug(
          `Whitelist recipient values: ${JSON.stringify(whitelistRecipientValues)}`,
        );

        // Fetch recipient key for the channel type. Ex. "to", "target"
        const ChannelTypeRecipientKey = RecipientKeyForChannelType[notificationEntry.channelType];

        if (ChannelTypeRecipientKey) {
          this.logger.debug(
            `Recipient Key for provider ${notificationEntry.providerId} with channel type ${notificationEntry.channelType}: [${ChannelTypeRecipientKey}]`,
          );

          // Create a list of recipient(s) added in request body
          const notificationRecipientRaw = notificationEntry.data[ChannelTypeRecipientKey];
          const notificationRecipientsArray =
            typeof notificationRecipientRaw === 'string'
              ? notificationRecipientRaw.split(',').map((recipient) => recipient.trim())
              : [notificationRecipientRaw];
          this.logger.debug(`Notification recipient list: ${notificationRecipientsArray}`);

          // Confirm if a whitelisted recipient is in request body
          const exists = (whitelistRecipientValues as string[]).some((item) =>
            notificationRecipientsArray.includes(item),
          );
          return exists;
        }
      }

      this.logger.debug('Notification provider does not have whitelisted recipient(s)');
      return false;
    } catch (error) {
      this.logger.log(`Error checking if recipient is whitelisted: ${error.message}`);
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

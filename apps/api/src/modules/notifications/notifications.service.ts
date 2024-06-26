import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { Status } from 'src/common/constants/database';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { NotificationResponse } from './dtos/notification-response.dto';
import { CoreService } from 'src/common/graphql/services/core.service';
import { QueryOptionsDto } from 'src/common/graphql/dtos/query-options.dto';
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ApplicationsService } from '../applications/applications.service';
import { ProvidersService } from '../providers/providers.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService extends CoreService<Notification> {
  protected readonly logger = new Logger(NotificationsService.name);
  private isProcessingQueue: boolean = false;
  private maxRetryCount: number;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationQueueService: NotificationQueueProducer,
    private readonly serverApiKeysService: ServerApiKeysService,
    private readonly applicationsService: ApplicationsService,
    private readonly providersService: ProvidersService,
    private readonly configService: ConfigService,
  ) {
    super(notificationRepository);
    this.maxRetryCount = +this.configService.get('MAX_RETRY_COUNT', 3);
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

    if (this.isProcessingQueue) {
      this.logger.log('Notifications are already being added to queue, skipping this CRON job');
      return;
    }

    this.isProcessingQueue = true;
    let allPendingNotifications: Notification[] = [];

    try {
      allPendingNotifications = await this.getPendingNotifications();
    } catch (error) {
      this.isProcessingQueue = false;
      this.logger.error('Error fetching pending notifications');
      this.logger.error(JSON.stringify(error, null, 2));
      return;
    }

    this.logger.log(`Adding ${allPendingNotifications.length} pending notifications to queue`);

    for (const notification of allPendingNotifications) {
      try {
        if (notification.retryCount < this.maxRetryCount) {
          notification.deliveryStatus = DeliveryStatus.IN_PROGRESS;
          await this.notificationQueueService.addNotificationToQueue(notification);
        } else {
          this.logger.log(
            `Notification with ID ${notification.id} has attempted max allowed retries, setting delivery status to FAILED`,
          );
          notification.deliveryStatus = DeliveryStatus.FAILED;
        }
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

  async getProviderConfirmation(): Promise<void> {
    this.logger.log(
      'Starting CRON job to add notifications to queue for confirmation from provider',
    );

    let allAwaitingConfirmationNotifications: Notification[] = [];

    try {
      allAwaitingConfirmationNotifications = await this.getAwaitingConfirmationNotifications();
    } catch (error) {
      this.logger.error('Error fetching awaiting confirmation notifications');
      this.logger.error(JSON.stringify(error, null, 2));
      return;
    }

    this.logger.log(
      `Adding ${allAwaitingConfirmationNotifications.length} awaiting confirmation notifications to queue`,
    );

    for (const notification of allAwaitingConfirmationNotifications) {
      try {
        if (notification.retryCount < this.maxRetryCount) {
          await this.notificationQueueService.addNotificationToQueue(notification);
        } else {
          this.logger.log(
            `Notification with ID ${notification.id} has attempted max allowed retries, setting delivery status to FAILED`,
          );
          notification.deliveryStatus = DeliveryStatus.FAILED;
        }
      } catch (error) {
        notification.deliveryStatus = DeliveryStatus.AWAITING_CONFIRMATION;
        notification.result = { result: error };
        this.logger.error(`Error adding notification with id: ${notification.id} to queue`);
        this.logger.error(JSON.stringify(error, null, 2));
      } finally {
        await this.notificationRepository.save(notification);
      }
    }
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

  async getAllNotifications(
    options: QueryOptionsDto,
    authorizationHeader: Request,
  ): Promise<NotificationResponse> {
    this.logger.log('Getting all notifications with options.');

    // Get the applicationId currently being used for filtering data based on api key
    const filterApplicationId = await this.getApplicationIdFromApiKey(authorizationHeader);

    const baseConditions = [
      { field: 'status', value: Status.ACTIVE },
      { field: 'applicationId', value: filterApplicationId },
    ];
    const searchableFields = ['createdBy', 'data', 'result'];

    const { items, total } = await super.findAll(
      options,
      'notification',
      searchableFields,
      baseConditions,
    );
    return new NotificationResponse(items, total, options.offset, options.limit);
  }
}

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification } from './entities/notification.entity';
import { DeliveryStatus, generateEnabledChannelEnum } from 'src/common/constants/notifications';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { Status } from 'src/common/constants/database';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { ConfigService } from '@nestjs/config';

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

  // TODO: Move to its own separate file
  @Cron(CronExpression.EVERY_SECOND)
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
}

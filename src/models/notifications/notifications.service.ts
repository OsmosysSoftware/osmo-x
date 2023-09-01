import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification } from './entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { Status } from 'src/common/constants/database';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private isProcessingQueue: boolean = false;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationQueueService: NotificationQueueProducer,
    private readonly configService: ConfigService,
  ) {}

  async createNotification(notificationData: CreateNotificationDto): Promise<Notification> {
    const notification = new Notification(notificationData);
    notification.createdBy = this.configService.getOrThrow<string>('CREATED_BY') || 'osmo_notify';
    notification.updatedBy = this.configService.getOrThrow<string>('CREATED_BY') || 'osmo_notify';
    return this.notificationRepository.save(notification);
  }

  // TODO: Move to its own separate file
  @Cron(CronExpression.EVERY_MINUTE)
  async addNotificationsToQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;
    const pendingNotifications = await this.getPendingNotifications();

    for (const notification of pendingNotifications) {
      try {
        notification.deliveryStatus = DeliveryStatus.IN_PROGRESS;
        await this.notificationQueueService.addNotificationToQueue(notification);
      } catch (error) {
        notification.deliveryStatus = DeliveryStatus.PENDING;
      } finally {
        await this.notificationRepository.save(notification);
      }
    }

    this.isProcessingQueue = false;
  }

  getPendingNotifications(): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        deliveryStatus: DeliveryStatus.PENDING,
      },
    });
  }

  getNotificationById(id: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        id: id,
        status: Status.ACTIVE,
      },
    });
  }
}

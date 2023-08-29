import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification } from './entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { NotificationData } from 'src/common/types/NotificationData';

@Injectable()
export class NotificationsService {
  private isProcessingQueue: boolean = false;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationQueueService: NotificationQueueProducer,
  ) {}

  async createNotification(notificationData: NotificationData): Promise<Notification[]> {
    const currentDate = new Date();
    notificationData.createdOn = currentDate.toISOString();
    notificationData.deliveryStatus = DeliveryStatus.PENDING;
    const notification = this.notificationRepository.create(notificationData);
    const result = await this.notificationRepository.save(notification);
    return result;
  }

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
}

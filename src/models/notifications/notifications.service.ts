import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { NotificationData } from 'src/common/types/NotificationData';

@Injectable()
export class NotificationsService {
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
    await this.notificationQueueService.addNotificationToQueue(notification);
    return result;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../notifications/entities/notification.entity';
import { Application } from '../applications/entities/application.entity';
import { Provider } from '../providers/entities/provider.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { Status } from 'src/common/constants/database';

export interface DashboardStats {
  totalApplications: number;
  totalProviders: number;
  totalNotifications: number;
  successfulNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  successRate: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [
      totalApplications,
      totalProviders,
      totalNotifications,
      successfulNotifications,
      failedNotifications,
      pendingNotifications,
    ] = await Promise.all([
      this.applicationRepository.count({ where: { status: Status.ACTIVE } }),
      this.providerRepository.count({ where: { status: Status.ACTIVE } }),
      this.notificationRepository.count(),
      this.notificationRepository.count({
        where: { deliveryStatus: DeliveryStatus.SUCCESS },
      }),
      this.notificationRepository.count({
        where: { deliveryStatus: DeliveryStatus.FAILED },
      }),
      this.notificationRepository.count({
        where: { deliveryStatus: DeliveryStatus.PENDING },
      }),
    ]);

    const successRate =
      totalNotifications > 0
        ? Math.round((successfulNotifications / totalNotifications) * 10000) / 100
        : 0;

    return {
      totalApplications,
      totalProviders,
      totalNotifications,
      successfulNotifications,
      failedNotifications,
      pendingNotifications,
      successRate,
    };
  }
}

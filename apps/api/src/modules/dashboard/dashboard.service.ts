import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../notifications/entities/notification.entity';
import { Application } from '../applications/entities/application.entity';
import { Provider } from '../providers/entities/provider.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { Status } from 'src/common/constants/database';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';

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

  async getStats(organizationId: number): Promise<DashboardStatsResponseDto> {
    const orgApps = await this.applicationRepository.find({
      where: { organizationId, status: Status.ACTIVE },
      select: ['applicationId'],
    });
    const appIds = orgApps.map((a) => a.applicationId);

    if (appIds.length === 0) {
      return {
        totalApplications: 0,
        totalProviders: 0,
        totalNotifications: 0,
        successfulNotifications: 0,
        failedNotifications: 0,
        pendingNotifications: 0,
        successRate: 0,
      };
    }

    const [
      totalProviders,
      totalNotifications,
      successfulNotifications,
      failedNotifications,
      pendingNotifications,
    ] = await Promise.all([
      this.providerRepository
        .createQueryBuilder('p')
        .where('p.status = :status', { status: Status.ACTIVE })
        .andWhere('p.applicationId IN (:...appIds)', { appIds })
        .getCount(),
      this.notificationRepository
        .createQueryBuilder('n')
        .where('n.applicationId IN (:...appIds)', { appIds })
        .andWhere('n.status = :status', { status: Status.ACTIVE })
        .getCount(),
      this.notificationRepository
        .createQueryBuilder('n')
        .where('n.applicationId IN (:...appIds)', { appIds })
        .andWhere('n.status = :status', { status: Status.ACTIVE })
        .andWhere('n.deliveryStatus = :ds', { ds: DeliveryStatus.SUCCESS })
        .getCount(),
      this.notificationRepository
        .createQueryBuilder('n')
        .where('n.applicationId IN (:...appIds)', { appIds })
        .andWhere('n.status = :status', { status: Status.ACTIVE })
        .andWhere('n.deliveryStatus = :ds', { ds: DeliveryStatus.FAILED })
        .getCount(),
      this.notificationRepository
        .createQueryBuilder('n')
        .where('n.applicationId IN (:...appIds)', { appIds })
        .andWhere('n.status = :status', { status: Status.ACTIVE })
        .andWhere('n.deliveryStatus = :ds', { ds: DeliveryStatus.PENDING })
        .getCount(),
    ]);

    const totalApplications = appIds.length;

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

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../notifications/entities/notification.entity';
import { Application } from '../applications/entities/application.entity';
import { Provider } from '../providers/entities/provider.entity';
import { DeliveryStatus } from 'src/common/constants/notifications';
import { Status } from 'src/common/constants/database';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import {
  DashboardAnalyticsResponseDto,
  TrendDataPointDto,
  ChannelBreakdownDto,
  ApplicationStatsDto,
  ProviderStatsDto,
} from './dto/dashboard-analytics-response.dto';

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

  async getAnalytics(
    organizationId: number,
    period: string = '30d',
    applicationId?: number,
  ): Promise<DashboardAnalyticsResponseDto> {
    const orgApps = await this.applicationRepository.find({
      where: { organizationId, status: Status.ACTIVE },
      select: ['applicationId', 'name'],
    });

    let appIds = orgApps.map((a) => a.applicationId);

    if (applicationId && appIds.includes(applicationId)) {
      appIds = [applicationId];
    }

    if (appIds.length === 0) {
      return { trends: [], channelBreakdown: [], applicationStats: [], providerStats: [] };
    }

    const dateFilter = this.getDateFilter(period);

    const [trends, channelBreakdown, applicationStats, providerStats] = await Promise.all([
      this.getTrends(appIds, dateFilter),
      this.getChannelBreakdown(appIds, dateFilter),
      this.getApplicationStats(appIds, orgApps, dateFilter),
      this.getProviderStats(appIds, dateFilter),
    ]);

    return { trends, channelBreakdown, applicationStats, providerStats };
  }

  private getDateFilter(period: string): Date | null {
    if (period === 'all') {
      return null;
    }

    const days = parseInt(period.replace('d', ''), 10) || 30;
    const date = new Date();
    date.setDate(date.getDate() - days);

    return date;
  }

  private async getTrends(appIds: number[], dateFilter: Date | null): Promise<TrendDataPointDto[]> {
    const qb = this.notificationRepository
      .createQueryBuilder('n')
      .select("TO_CHAR(n.createdOn, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN n.deliveryStatus = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END)`,
        'successful',
      )
      .addSelect(
        `SUM(CASE WHEN n.deliveryStatus = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END)`,
        'failed',
      )
      .where('n.applicationId IN (:...appIds)', { appIds })
      .andWhere('n.status = :status', { status: Status.ACTIVE });

    if (dateFilter) {
      qb.andWhere('n.createdOn >= :dateFilter', { dateFilter });
    }

    const rows = await qb
      .groupBy("TO_CHAR(n.createdOn, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(n.createdOn, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      date: r.date,
      total: parseInt(r.total, 10),
      successful: parseInt(r.successful, 10),
      failed: parseInt(r.failed, 10),
    }));
  }

  private async getChannelBreakdown(
    appIds: number[],
    dateFilter: Date | null,
  ): Promise<ChannelBreakdownDto[]> {
    const qb = this.notificationRepository
      .createQueryBuilder('n')
      .select('n.channelType', 'channelType')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN n.deliveryStatus = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END)`,
        'successful',
      )
      .addSelect(
        `SUM(CASE WHEN n.deliveryStatus = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END)`,
        'failed',
      )
      .where('n.applicationId IN (:...appIds)', { appIds })
      .andWhere('n.status = :status', { status: Status.ACTIVE });

    if (dateFilter) {
      qb.andWhere('n.createdOn >= :dateFilter', { dateFilter });
    }

    const rows = await qb.groupBy('n.channelType').orderBy('total', 'DESC').getRawMany();

    return rows.map((r) => ({
      channelType: parseInt(r.channelType, 10),
      total: parseInt(r.total, 10),
      successful: parseInt(r.successful, 10),
      failed: parseInt(r.failed, 10),
    }));
  }

  private async getApplicationStats(
    appIds: number[],
    orgApps: Application[],
    dateFilter: Date | null,
  ): Promise<ApplicationStatsDto[]> {
    const appNameMap = new Map(orgApps.map((a) => [a.applicationId, a.name]));

    const qb = this.notificationRepository
      .createQueryBuilder('n')
      .select('n.applicationId', 'applicationId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN n.deliveryStatus = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END)`,
        'successful',
      )
      .addSelect(
        `SUM(CASE WHEN n.deliveryStatus = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END)`,
        'failed',
      )
      .where('n.applicationId IN (:...appIds)', { appIds })
      .andWhere('n.status = :status', { status: Status.ACTIVE });

    if (dateFilter) {
      qb.andWhere('n.createdOn >= :dateFilter', { dateFilter });
    }

    const rows = await qb.groupBy('n.applicationId').orderBy('total', 'DESC').getRawMany();

    return rows.map((r) => {
      const total = parseInt(r.total, 10);
      const successful = parseInt(r.successful, 10);
      const failed = parseInt(r.failed, 10);

      return {
        applicationId: parseInt(r.applicationId, 10),
        applicationName: appNameMap.get(parseInt(r.applicationId, 10)) || 'Unknown',
        total,
        successful,
        failed,
        successRate: total > 0 ? Math.round((successful / total) * 10000) / 100 : 0,
      };
    });
  }

  private async getProviderStats(
    appIds: number[],
    dateFilter: Date | null,
  ): Promise<ProviderStatsDto[]> {
    const qb = this.notificationRepository
      .createQueryBuilder('n')
      .select('n.providerId', 'providerId')
      .addSelect('p.name', 'providerName')
      .addSelect('p.channelType', 'channelType')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN n.deliveryStatus = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END)`,
        'successful',
      )
      .addSelect(
        `SUM(CASE WHEN n.deliveryStatus = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END)`,
        'failed',
      )
      .addSelect('ROUND(AVG(n.retryCount)::numeric, 2)', 'avgRetryCount')
      .innerJoin(Provider, 'p', 'p.providerId = n.providerId')
      .where('n.applicationId IN (:...appIds)', { appIds })
      .andWhere('n.status = :status', { status: Status.ACTIVE });

    if (dateFilter) {
      qb.andWhere('n.createdOn >= :dateFilter', { dateFilter });
    }

    const rows = await qb
      .groupBy('n.providerId')
      .addGroupBy('p.name')
      .addGroupBy('p.channelType')
      .orderBy('total', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      providerId: parseInt(r.providerId, 10),
      providerName: r.providerName,
      channelType: parseInt(r.channelType, 10),
      total: parseInt(r.total, 10),
      successful: parseInt(r.successful, 10),
      failed: parseInt(r.failed, 10),
      avgRetryCount: parseFloat(r.avgRetryCount) || 0,
    }));
  }
}

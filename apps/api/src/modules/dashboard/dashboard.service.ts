import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../notifications/entities/notification.entity';
import { ArchivedNotification } from '../archived-notifications/entities/archived-notification.entity';
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

export type DashboardSource = 'active' | 'archived' | 'both';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(ArchivedNotification)
    private readonly archivedNotificationRepository: Repository<ArchivedNotification>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  async getStats(
    organizationId: number,
    source: DashboardSource = 'both',
    period: string = 'all',
  ): Promise<DashboardStatsResponseDto> {
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

    const dateFilter = this.getDateFilter(period);
    const where = this.buildWhereClause(appIds, dateFilter);

    const unionSql = this.buildUnion(source, `SELECT delivery_status`, where);

    const sql =
      `SELECT combined.delivery_status, COUNT(*) as cnt ` +
      `FROM (${unionSql}) as combined ` +
      `GROUP BY combined.delivery_status`;

    const [totalProviders, rows] = await Promise.all([
      this.providerRepository
        .createQueryBuilder('p')
        .where('p.status = :status', { status: Status.ACTIVE })
        .andWhere('p.applicationId IN (:...appIds)', { appIds })
        .getCount(),
      this.notificationRepository.query(sql, appIds),
    ]);

    let totalNotifications = 0;
    let successfulNotifications = 0;
    let failedNotifications = 0;
    let pendingNotifications = 0;

    for (const row of rows) {
      const count = parseInt(row.cnt, 10);
      totalNotifications += count;

      if (parseInt(row.delivery_status, 10) === DeliveryStatus.SUCCESS) {
        successfulNotifications = count;
      } else if (parseInt(row.delivery_status, 10) === DeliveryStatus.FAILED) {
        failedNotifications = count;
      } else if (parseInt(row.delivery_status, 10) === DeliveryStatus.PENDING) {
        pendingNotifications = count;
      }
    }

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
    period: string = '24h',
    applicationId?: number,
    source: DashboardSource = 'both',
    timezone: string = 'UTC',
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
      this.getTrends(appIds, dateFilter, source, period, timezone),
      this.getChannelBreakdown(appIds, dateFilter, source),
      this.getApplicationStats(appIds, orgApps, dateFilter, source),
      this.getProviderStats(appIds, dateFilter, source),
    ]);

    return { trends, channelBreakdown, applicationStats, providerStats };
  }

  private getDateFilter(period: string): Date | null {
    if (period === 'all') {
      return null;
    }

    const now = new Date();

    if (period.endsWith('h')) {
      const hours = parseInt(period.replace('h', ''), 10) || 24;
      now.setHours(now.getHours() - hours);

      return now;
    }

    const days = parseInt(period.replace('d', ''), 10) || 30;
    now.setDate(now.getDate() - days);

    return now;
  }

  /**
   * Builds a UNION ALL query from active and/or archived notification tables.
   * The inner SELECTs should only select raw columns (no aggregation).
   * The caller wraps this in an outer query that does the aggregation.
   */
  private buildUnion(source: DashboardSource, selectClause: string, whereClause: string): string {
    const parts: string[] = [];

    if (source === 'active' || source === 'both') {
      parts.push(`${selectClause} FROM notify_notifications ${whereClause}`);
    }

    if (source === 'archived' || source === 'both') {
      parts.push(`${selectClause} FROM notify_archived_notifications ${whereClause}`);
    }

    return parts.join(' UNION ALL ');
  }

  private buildWhereClause(appIds: number[], dateFilter: Date | null): string {
    const placeholders = appIds.map((_, i) => `$${i + 1}`).join(', ');
    let where = `WHERE application_id IN (${placeholders}) AND status = ${Status.ACTIVE}`;

    if (dateFilter) {
      where += ` AND created_on >= '${dateFilter.toISOString()}'`;
    }

    return where;
  }

  private async getTrends(
    appIds: number[],
    dateFilter: Date | null,
    source: DashboardSource,
    period: string,
    timezone: string = 'UTC',
  ): Promise<TrendDataPointDto[]> {
    const safeTimezone = this.sanitizeTimezone(timezone);
    const isHourly = period.endsWith('h') || period === '1d';
    const tzCreatedOn = `(combined.created_on AT TIME ZONE 'UTC') AT TIME ZONE '${safeTimezone}'`;
    const dateExpr = isHourly
      ? `TO_CHAR(${tzCreatedOn}, 'YYYY-MM-DD HH24:00')`
      : `TO_CHAR(${tzCreatedOn}, 'YYYY-MM-DD')`;

    const where = this.buildWhereClause(appIds, dateFilter);
    const unionSql = this.buildUnion(source, 'SELECT created_on, delivery_status', where);

    const sql =
      `SELECT ${dateExpr} as date, COUNT(*) as total, ` +
      `SUM(CASE WHEN combined.delivery_status = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END) as successful, ` +
      `SUM(CASE WHEN combined.delivery_status = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END) as failed ` +
      `FROM (${unionSql}) as combined ` +
      `GROUP BY ${dateExpr} ` +
      `ORDER BY date ASC`;

    const rows = await this.notificationRepository.query(sql, appIds);

    return rows.map((r: Record<string, string>) => ({
      date: r.date,
      total: parseInt(r.total, 10),
      successful: parseInt(r.successful, 10),
      failed: parseInt(r.failed, 10),
    }));
  }

  private sanitizeTimezone(timezone: string): string {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });

      return timezone;
    } catch {
      return 'UTC';
    }
  }

  private async getChannelBreakdown(
    appIds: number[],
    dateFilter: Date | null,
    source: DashboardSource,
  ): Promise<ChannelBreakdownDto[]> {
    const where = this.buildWhereClause(appIds, dateFilter);
    const unionSql = this.buildUnion(source, 'SELECT channel_type, delivery_status', where);

    const sql =
      `SELECT combined.channel_type, COUNT(*) as total, ` +
      `SUM(CASE WHEN combined.delivery_status = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END) as successful, ` +
      `SUM(CASE WHEN combined.delivery_status = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END) as failed ` +
      `FROM (${unionSql}) as combined ` +
      `GROUP BY combined.channel_type ` +
      `ORDER BY total DESC`;

    const rows = await this.notificationRepository.query(sql, appIds);

    return rows.map((r: Record<string, string>) => ({
      channelType: parseInt(r.channel_type, 10),
      total: parseInt(r.total, 10),
      successful: parseInt(r.successful, 10),
      failed: parseInt(r.failed, 10),
    }));
  }

  private async getApplicationStats(
    appIds: number[],
    orgApps: Application[],
    dateFilter: Date | null,
    source: DashboardSource,
  ): Promise<ApplicationStatsDto[]> {
    const appNameMap = new Map(orgApps.map((a) => [a.applicationId, a.name]));
    const where = this.buildWhereClause(appIds, dateFilter);
    const unionSql = this.buildUnion(source, 'SELECT application_id, delivery_status', where);

    const sql =
      `SELECT combined.application_id, COUNT(*) as total, ` +
      `SUM(CASE WHEN combined.delivery_status = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END) as successful, ` +
      `SUM(CASE WHEN combined.delivery_status = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END) as failed ` +
      `FROM (${unionSql}) as combined ` +
      `GROUP BY combined.application_id ` +
      `ORDER BY total DESC`;

    const rows = await this.notificationRepository.query(sql, appIds);

    return rows.map((r: Record<string, string>) => {
      const total = parseInt(r.total, 10);
      const successful = parseInt(r.successful, 10);
      const failed = parseInt(r.failed, 10);

      return {
        applicationId: parseInt(r.application_id, 10),
        applicationName: appNameMap.get(parseInt(r.application_id, 10)) || 'Unknown',
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
    source: DashboardSource,
  ): Promise<ProviderStatsDto[]> {
    const placeholders = appIds.map((_, i) => `$${i + 1}`).join(', ');
    let dateCondition = '';

    if (dateFilter) {
      dateCondition = ` AND n.created_on >= '${dateFilter.toISOString()}'`;
    }

    const parts: string[] = [];

    if (source === 'active' || source === 'both') {
      parts.push(
        `SELECT n.provider_id, n.delivery_status, n.retry_count, p.name as provider_name, p.channel_type ` +
          `FROM notify_notifications n ` +
          `INNER JOIN notify_providers p ON p.provider_id = n.provider_id ` +
          `WHERE n.application_id IN (${placeholders}) AND n.status = ${Status.ACTIVE}${dateCondition}`,
      );
    }

    if (source === 'archived' || source === 'both') {
      parts.push(
        `SELECT n.provider_id, n.delivery_status, n.retry_count, p.name as provider_name, p.channel_type ` +
          `FROM notify_archived_notifications n ` +
          `INNER JOIN notify_providers p ON p.provider_id = n.provider_id ` +
          `WHERE n.application_id IN (${placeholders}) AND n.status = ${Status.ACTIVE}${dateCondition}`,
      );
    }

    const unionSql = parts.join(' UNION ALL ');

    const sql =
      `SELECT combined.provider_id, combined.provider_name, combined.channel_type, ` +
      `COUNT(*) as total, ` +
      `SUM(CASE WHEN combined.delivery_status = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END) as successful, ` +
      `SUM(CASE WHEN combined.delivery_status = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END) as failed, ` +
      `ROUND(AVG(combined.retry_count)::numeric, 2) as avg_retry_count ` +
      `FROM (${unionSql}) as combined ` +
      `GROUP BY combined.provider_id, combined.provider_name, combined.channel_type ` +
      `ORDER BY total DESC`;

    const rows = await this.notificationRepository.query(sql, appIds);

    return rows.map((r: Record<string, string>) => ({
      providerId: parseInt(r.provider_id, 10),
      providerName: r.provider_name,
      channelType: parseInt(r.channel_type, 10),
      total: parseInt(r.total, 10),
      successful: parseInt(r.successful, 10),
      failed: parseInt(r.failed, 10),
      avgRetryCount: parseFloat(r.avg_retry_count) || 0,
    }));
  }
}

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

/**
 * How long a computed dashboard payload stays reusable.
 *
 * These are whole-org read-only aggregates over both notification tables; with period='all' they
 * scan the entire archive and cost seconds. The portal fires stats + analytics together on every
 * dashboard paint and again on every period/source toggle, so the same expensive aggregate is
 * frequently recomputed within a few seconds. A short TTL collapses that without making the
 * numbers meaningfully stale.
 */
const DASHBOARD_CACHE_TTL_MS = 30_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class DashboardService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

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

  /**
   * Serve `compute` from cache when a fresh entry exists, otherwise compute and store it.
   * Expired entries are evicted lazily on access, and on each miss we sweep the rest so the map
   * cannot grow unbounded across orgs/periods.
   */
  private async cached<T>(key: string, compute: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = this.cache.get(key);

    if (hit && hit.expiresAt > now) {
      return hit.value as T;
    }

    for (const [existingKey, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        this.cache.delete(existingKey);
      }
    }

    const value = await compute();
    this.cache.set(key, { value, expiresAt: now + DASHBOARD_CACHE_TTL_MS });

    return value;
  }

  async getStats(
    organizationId: number,
    source: DashboardSource = 'both',
    period: string = 'all',
  ): Promise<DashboardStatsResponseDto> {
    return this.cached(`stats:${organizationId}:${source}:${period}`, () =>
      this.computeStats(organizationId, source, period),
    );
  }

  private async computeStats(
    organizationId: number,
    source: DashboardSource,
    period: string,
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

    const unionSql = this.buildAggregatedUnion(
      source,
      `SELECT delivery_status, COUNT(*) as cnt`,
      where,
      'delivery_status',
    );

    const sql =
      `SELECT combined.delivery_status, SUM(combined.cnt) as cnt ` +
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
    const key = `analytics:${organizationId}:${period}:${applicationId ?? 'all'}:${source}:${timezone}`;

    return this.cached(key, () =>
      this.computeAnalytics(organizationId, period, applicationId, source, timezone),
    );
  }

  private async computeAnalytics(
    organizationId: number,
    period: string,
    applicationId: number | undefined,
    source: DashboardSource,
    timezone: string,
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

  /**
   * Like buildUnion, but each branch aggregates before the UNION so only per-group rows cross it.
   *
   * The plain form makes Postgres materialise every matching row through the UNION ALL node before
   * the outer GROUP BY sees it — over 1.46M archived rows that measured 3.2s, versus 1.8s when the
   * COUNT happens inside each branch against the (status, application_id, created_on) index.
   * The caller wraps this in an outer query that re-aggregates the per-branch subtotals.
   */
  private buildAggregatedUnion(
    source: DashboardSource,
    selectClause: string,
    whereClause: string,
    groupByClause: string,
  ): string {
    const parts: string[] = [];

    if (source === 'active' || source === 'both') {
      parts.push(
        `${selectClause} FROM notify_notifications ${whereClause} GROUP BY ${groupByClause}`,
      );
    }

    if (source === 'archived' || source === 'both') {
      parts.push(
        `${selectClause} FROM notify_archived_notifications ${whereClause} GROUP BY ${groupByClause}`,
      );
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

    // Bucket expression, parameterised by column reference so it can be evaluated inside each
    // UNION branch (bare column) as well as in the outer query (combined.*).
    const bucketExpr = (createdOn: string): string => {
      const tzCreatedOn = `(${createdOn} AT TIME ZONE 'UTC') AT TIME ZONE '${safeTimezone}'`;

      return isHourly
        ? `TO_CHAR(${tzCreatedOn}, 'YYYY-MM-DD HH24:00')`
        : `TO_CHAR(${tzCreatedOn}, 'YYYY-MM-DD')`;
    };

    const innerBucket = bucketExpr('created_on');
    const where = this.buildWhereClause(appIds, dateFilter);
    const unionSql = this.buildAggregatedUnion(
      source,
      `SELECT ${innerBucket} as date, COUNT(*) as total, ` +
        `SUM(CASE WHEN delivery_status = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END) as successful, ` +
        `SUM(CASE WHEN delivery_status = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END) as failed`,
      where,
      innerBucket,
    );

    const sql =
      `SELECT combined.date as date, SUM(combined.total) as total, ` +
      `SUM(combined.successful) as successful, ` +
      `SUM(combined.failed) as failed ` +
      `FROM (${unionSql}) as combined ` +
      `GROUP BY combined.date ` +
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
    const unionSql = this.buildAggregatedUnion(
      source,
      `SELECT channel_type, COUNT(*) as total, ` +
        `SUM(CASE WHEN delivery_status = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END) as successful, ` +
        `SUM(CASE WHEN delivery_status = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END) as failed`,
      where,
      'channel_type',
    );

    const sql =
      `SELECT combined.channel_type, SUM(combined.total) as total, ` +
      `SUM(combined.successful) as successful, ` +
      `SUM(combined.failed) as failed ` +
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
    const unionSql = this.buildAggregatedUnion(
      source,
      `SELECT application_id, COUNT(*) as total, ` +
        `SUM(CASE WHEN delivery_status = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END) as successful, ` +
        `SUM(CASE WHEN delivery_status = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END) as failed`,
      where,
      'application_id',
    );

    const sql =
      `SELECT combined.application_id, SUM(combined.total) as total, ` +
      `SUM(combined.successful) as successful, ` +
      `SUM(combined.failed) as failed ` +
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
      dateCondition = ` AND created_on >= '${dateFilter.toISOString()}'`;
    }

    const parts: string[] = [];

    // Aggregate per provider inside each branch BEFORE touching notify_providers. Joining the
    // provider table against the full 1.46M-row archive only to group it away afterwards is pure
    // waste; joining afterwards means the join sees one row per provider instead.
    //
    // retry_count is carried as a SUM (not an AVG) so the branches can be combined correctly —
    // averaging pre-computed averages would weight a 10-row branch the same as a 1M-row one.
    const branchSelect =
      `SELECT provider_id, COUNT(*) as total, ` +
      `SUM(CASE WHEN delivery_status = ${DeliveryStatus.SUCCESS} THEN 1 ELSE 0 END) as successful, ` +
      `SUM(CASE WHEN delivery_status = ${DeliveryStatus.FAILED} THEN 1 ELSE 0 END) as failed, ` +
      `SUM(retry_count) as retry_total`;
    const branchWhere = `WHERE application_id IN (${placeholders}) AND status = ${Status.ACTIVE}${dateCondition}`;

    if (source === 'active' || source === 'both') {
      parts.push(`${branchSelect} FROM notify_notifications ${branchWhere} GROUP BY provider_id`);
    }

    if (source === 'archived' || source === 'both') {
      parts.push(
        `${branchSelect} FROM notify_archived_notifications ${branchWhere} GROUP BY provider_id`,
      );
    }

    const unionSql = parts.join(' UNION ALL ');

    const sql =
      `SELECT agg.provider_id, p.name as provider_name, p.channel_type, ` +
      `agg.total, agg.successful, agg.failed, ` +
      `ROUND((agg.retry_total::numeric / NULLIF(agg.total, 0)), 2) as avg_retry_count ` +
      `FROM (` +
      `SELECT combined.provider_id, SUM(combined.total) as total, ` +
      `SUM(combined.successful) as successful, ` +
      `SUM(combined.failed) as failed, ` +
      `SUM(combined.retry_total) as retry_total ` +
      `FROM (${unionSql}) as combined ` +
      `GROUP BY combined.provider_id` +
      `) as agg ` +
      `INNER JOIN notify_providers p ON p.provider_id = agg.provider_id ` +
      `ORDER BY agg.total DESC`;

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

import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SkeletonModule } from 'primeng/skeleton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DashboardService, DashboardSource } from '../../features/dashboard/dashboard.service';
import { NotificationTrendsWidget } from './widgets/notification-trends-widget';
import { ChannelBreakdownWidget } from './widgets/channel-breakdown-widget';
import { ApplicationStatsWidget } from './widgets/application-stats-widget';
import { ProviderHealthWidget } from './widgets/provider-health-widget';

@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    SkeletonModule,
    SelectButtonModule,
    NotificationTrendsWidget,
    ChannelBreakdownWidget,
    ApplicationStatsWidget,
    ProviderHealthWidget,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly stats = this.dashboardService.stats;
  readonly analytics = this.dashboardService.analytics;
  readonly loading = signal(true);
  readonly analyticsLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly periodOptions = [
    { label: '1h', value: '1h' },
    { label: '6h', value: '6h' },
    { label: '24h', value: '24h' },
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
    { label: 'All', value: 'all' },
  ];
  readonly selectedPeriod = signal('24h');

  readonly sourceOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' },
    { label: 'Both', value: 'both' },
  ];
  readonly selectedSource = signal<DashboardSource>('both');

  readonly filterPt = {
    root: {
      style: {
        '--p-togglebutton-content-checked-background': 'var(--p-primary-color)',
        '--p-togglebutton-content-checked-shadow': 'none',
        '--p-togglebutton-checked-color': 'var(--p-primary-contrast-color)',
      },
    },
  };

  ngOnInit(): void {
    this.loadAll();
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod.set(period);
    this.loadAll();
  }

  onSourceChange(source: DashboardSource): void {
    this.selectedSource.set(source);
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);

    this.dashboardService.loadStats(this.selectedSource(), this.selectedPeriod()).subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load dashboard stats');
      },
    });

    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    this.analyticsLoading.set(true);

    this.dashboardService.loadAnalytics(this.selectedPeriod(), this.selectedSource()).subscribe({
      next: () => this.analyticsLoading.set(false),
      error: () => this.analyticsLoading.set(false),
    });
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
  signal,
  afterNextRender,
} from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { LayoutService } from '../../../layout/service/layout.service';
import { TrendDataPoint } from '../../../core/models/api.model';

@Component({
  selector: 'app-notification-trends-widget',
  standalone: true,
  imports: [ChartModule, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-trends-widget.html',
})
export class NotificationTrendsWidget {
  readonly data = input<TrendDataPoint[]>([]);
  readonly loading = input(false);

  private readonly layoutService = inject(LayoutService);

  readonly chartData = signal<unknown>(null);
  readonly chartOptions = signal<unknown>(null);

  constructor() {
    afterNextRender(() => {
      setTimeout(() => this.initChart(), 150);
    });

    effect(() => {
      this.layoutService.isDarkTheme();
      this.data();
      setTimeout(() => this.initChart(), 150);
    });
  }

  private initChart(): void {
    const trends = this.data();

    if (!trends || trends.length === 0) {
      return;
    }

    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--text-color');
    const borderColor = style.getPropertyValue('--surface-border');
    const textMuted = style.getPropertyValue('--text-color-secondary');

    this.chartData.set({
      labels: trends.map((t) => t.date.slice(5)),
      datasets: [
        {
          label: 'Successful',
          backgroundColor: style.getPropertyValue('--p-green-400'),
          data: trends.map((t) => t.successful),
          barThickness: 16,
        },
        {
          label: 'Failed',
          backgroundColor: style.getPropertyValue('--p-red-400'),
          data: trends.map((t) => t.failed),
          barThickness: 16,
        },
        {
          label: 'Other',
          backgroundColor: style.getPropertyValue('--p-yellow-400'),
          data: trends.map((t) => t.total - t.successful - t.failed),
          barThickness: 16,
        },
      ],
    });

    this.chartOptions.set({
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: { labels: { color: textColor } },
        tooltip: { mode: 'index' as const, intersect: false },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: textMuted },
          grid: { color: 'transparent' },
        },
        y: {
          stacked: true,
          ticks: { color: textMuted },
          grid: { color: borderColor },
        },
      },
    });
  }
}

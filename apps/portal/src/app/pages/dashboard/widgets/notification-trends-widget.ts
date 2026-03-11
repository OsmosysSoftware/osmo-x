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

    const greenColor = style.getPropertyValue('--p-green-400');
    const redColor = style.getPropertyValue('--p-red-400');
    const blueColor = style.getPropertyValue('--p-blue-400');

    this.chartData.set({
      labels: trends.map((t) => t.date.slice(5)),
      datasets: [
        {
          label: 'Total',
          borderColor: blueColor,
          backgroundColor: blueColor + '20',
          data: trends.map((t) => t.total),
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: 'Successful',
          borderColor: greenColor,
          backgroundColor: greenColor + '15',
          data: trends.map((t) => t.successful),
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: 'Failed',
          borderColor: redColor,
          backgroundColor: redColor + '15',
          data: trends.map((t) => t.failed),
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    });

    this.chartOptions.set({
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: {
          labels: { color: textColor, usePointStyle: true, pointStyle: 'circle' },
        },
        tooltip: { mode: 'index' as const, intersect: false },
      },
      scales: {
        x: {
          ticks: { color: textMuted, maxRotation: 45 },
          grid: { color: 'transparent' },
        },
        y: {
          beginAtZero: true,
          ticks: { color: textMuted },
          grid: { color: borderColor, drawBorder: false },
        },
      },
    });
  }
}

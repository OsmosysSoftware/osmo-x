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
import { ApplicationStats } from '../../../core/models/api.model';

@Component({
  selector: 'app-application-stats-widget',
  standalone: true,
  imports: [ChartModule, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './application-stats-widget.html',
})
export class ApplicationStatsWidget {
  readonly data = input<ApplicationStats[]>([]);
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
    const apps = this.data();

    if (!apps || apps.length === 0) {
      return;
    }

    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--text-color');
    const borderColor = style.getPropertyValue('--surface-border');
    const textMuted = style.getPropertyValue('--text-color-secondary');

    this.chartData.set({
      labels: apps.map((a) => a.application_name),
      datasets: [
        {
          label: 'Successful',
          backgroundColor: style.getPropertyValue('--p-green-400'),
          borderColor: style.getPropertyValue('--p-green-500'),
          borderWidth: 1,
          borderRadius: 4,
          data: apps.map((a) => a.successful),
        },
        {
          label: 'Failed',
          backgroundColor: style.getPropertyValue('--p-red-400'),
          borderColor: style.getPropertyValue('--p-red-500'),
          borderWidth: 1,
          borderRadius: 4,
          data: apps.map((a) => a.failed),
        },
      ],
    });

    this.chartOptions.set({
      indexAxis: 'y' as const,
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: { color: textColor, usePointStyle: true, pointStyle: 'circle' },
        },
        tooltip: { mode: 'index' as const, intersect: false },
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          ticks: { color: textMuted },
          grid: { color: borderColor, drawBorder: false },
        },
        y: {
          stacked: true,
          ticks: { color: textMuted },
          grid: { color: 'transparent' },
        },
      },
    });
  }
}

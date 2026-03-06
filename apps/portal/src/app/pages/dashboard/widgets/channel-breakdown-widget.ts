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
import { ChannelBreakdown } from '../../../core/models/api.model';
import { ChannelType } from '../../../core/constants/notification';

// Group individual channel types into categories for the doughnut chart
const CHANNEL_CATEGORIES: Record<string, number[]> = {
  Email: [1, 2, 11],
  SMS: [5, 6, 12],
  WhatsApp: [3, 4, 7],
  Push: [9],
  Voice: [10],
};

@Component({
  selector: 'app-channel-breakdown-widget',
  standalone: true,
  imports: [ChartModule, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './channel-breakdown-widget.html',
})
export class ChannelBreakdownWidget {
  readonly data = input<ChannelBreakdown[]>([]);
  readonly loading = input(false);

  private readonly layoutService = inject(LayoutService);

  readonly chartData = signal<unknown>(null);
  readonly chartOptions = signal<unknown>(null);
  readonly detailRows = signal<{ label: string; total: number }[]>([]);

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
    const breakdown = this.data();

    if (!breakdown || breakdown.length === 0) {
      return;
    }

    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--text-color');

    // Group by category
    const categoryTotals = new Map<string, number>();

    for (const [category, channelIds] of Object.entries(CHANNEL_CATEGORIES)) {
      const total = breakdown
        .filter((b) => channelIds.includes(b.channel_type))
        .reduce((sum, b) => sum + b.total, 0);

      if (total > 0) {
        categoryTotals.set(category, total);
      }
    }

    // Also build detail rows per individual channel
    this.detailRows.set(
      breakdown.map((b) => ({
        label: ChannelType[b.channel_type] || `Channel ${b.channel_type}`,
        total: b.total,
      })),
    );

    const labels = Array.from(categoryTotals.keys());
    const data = Array.from(categoryTotals.values());
    const colors = [
      style.getPropertyValue('--p-blue-400'),
      style.getPropertyValue('--p-green-400'),
      style.getPropertyValue('--p-teal-400'),
      style.getPropertyValue('--p-orange-400'),
      style.getPropertyValue('--p-purple-400'),
    ];

    this.chartData.set({
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          hoverBackgroundColor: colors.slice(0, labels.length),
        },
      ],
    });

    this.chartOptions.set({
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: { color: textColor, usePointStyle: true },
        },
      },
    });
  }
}

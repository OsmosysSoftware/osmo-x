import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ProviderStats } from '../../../core/models/api.model';
import { ChannelType } from '../../../core/constants/notification';

interface ProviderRow {
  provider_name: string;
  channel_label: string;
  total: number;
  success_rate: number;
  avg_retry_count: number;
}

@Component({
  selector: 'app-provider-health-widget',
  standalone: true,
  imports: [TableModule, TagModule, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './provider-health-widget.html',
})
export class ProviderHealthWidget {
  readonly data = input<ProviderStats[]>([]);
  readonly loading = input(false);

  readonly rows = computed<ProviderRow[]>(() => {
    const providers = this.data();

    if (!providers) {
      return [];
    }

    return providers.map((p) => ({
      provider_name: p.provider_name,
      channel_label: ChannelType[p.channel_type] || `Channel ${p.channel_type}`,
      total: p.total,
      success_rate: p.total > 0 ? Math.round((p.successful / p.total) * 10000) / 100 : 0,
      avg_retry_count: p.avg_retry_count,
    }));
  });

  getSeverity(rate: number): 'success' | 'warn' | 'danger' {
    if (rate >= 90) {
      return 'success';
    }

    if (rate >= 70) {
      return 'warn';
    }

    return 'danger';
  }
}

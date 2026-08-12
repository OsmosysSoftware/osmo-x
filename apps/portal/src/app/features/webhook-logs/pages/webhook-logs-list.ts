import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { JsonViewerDialog } from '../../../shared/components/json-viewer-dialog/json-viewer-dialog';
import { WebhookLogsService } from '../services/webhook-logs.service';
import { WebhookLog, PageInfo } from '../../../core/models/api.model';

const WEBHOOK_DELIVERY_STATUS_LABEL: Record<number, string> = {
  1: 'Retrying',
  2: 'Success',
  3: 'Failed',
};

const WEBHOOK_DELIVERY_STATUS_SEVERITY: Record<number, 'success' | 'warn' | 'danger'> = {
  1: 'warn',
  2: 'success',
  3: 'danger',
};

@Component({
  selector: 'app-webhook-logs-list',
  imports: [
    RouterLink,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    TooltipModule,
    PaginationComponent,
    JsonViewerDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './webhook-logs-list.html',
  styleUrl: './webhook-logs-list.scss',
})
export class WebhookLogsListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly webhookLogsService = inject(WebhookLogsService);

  private readonly webhookId = Number(this.route.snapshot.paramMap.get('id'));

  readonly logs = signal<WebhookLog[]>([]);
  readonly loading = signal(true);
  readonly pageInfo = signal<PageInfo | null>(null);
  private readonly currentPage = signal(1);
  private readonly currentLimit = signal(20);

  readonly jsonDialogVisible = signal(false);
  readonly jsonDialogData = signal<Record<string, unknown> | null>(null);
  readonly jsonDialogHeader = signal('JSON Data');

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);

    this.webhookLogsService
      .list(this.webhookId, this.currentPage(), this.currentLimit())
      .subscribe({
        next: (res) => {
          this.logs.set(res.items ?? []);
          this.pageInfo.set(res.page_info ?? null);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(event: { page: number; limit: number }): void {
    this.currentPage.set(event.page);
    this.currentLimit.set(event.limit);
    this.loadLogs();
  }

  statusLabel(status: number): string {
    return WEBHOOK_DELIVERY_STATUS_LABEL[status] ?? `Unknown (${status})`;
  }

  statusSeverity(status: number): 'success' | 'warn' | 'danger' {
    return WEBHOOK_DELIVERY_STATUS_SEVERITY[status] ?? 'warn';
  }

  viewJson(data: unknown, header: string): void {
    this.jsonDialogData.set((data as Record<string, unknown>) ?? null);
    this.jsonDialogHeader.set(header);
    this.jsonDialogVisible.set(true);
  }
}

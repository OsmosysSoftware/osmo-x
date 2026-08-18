import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { switchMap, tap } from 'rxjs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { JsonViewerDialog } from '../../../shared/components/json-viewer-dialog/json-viewer-dialog';
import { WebhookLogsService } from '../services/webhook-logs.service';
import { WebhooksService } from '../../webhooks/services/webhooks.service';
import { ProvidersService } from '../../providers/services/providers.service';
import { ApplicationsService } from '../../applications/services/applications.service';
import { WebhookLog, Webhook, PageInfo } from '../../../core/models/api.model';

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
    ToolbarModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
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
  private readonly webhooksService = inject(WebhooksService);
  private readonly providersService = inject(ProvidersService);
  private readonly applicationsService = inject(ApplicationsService);

  private readonly webhookId = Number(this.route.snapshot.paramMap.get('id'));

  readonly logs = signal<WebhookLog[]>([]);
  readonly loading = signal(true);
  readonly pageInfo = signal<PageInfo | null>(null);
  private readonly currentPage = signal(1);
  private readonly currentLimit = signal(20);
  readonly searchTerm = signal<string>('');
  private searchDebounce?: ReturnType<typeof setTimeout>;

  readonly webhook = signal<Webhook | null>(null);
  readonly providerName = signal<string | null>(null);
  readonly applicationName = signal<string | null>(null);

  readonly jsonDialogVisible = signal(false);
  readonly jsonDialogData = signal<Record<string, unknown> | null>(null);
  readonly jsonDialogHeader = signal('JSON Data');

  ngOnInit(): void {
    this.loadLogs();
    this.loadContext();
  }

  private loadContext(): void {
    this.webhooksService
      .getById(this.webhookId)
      .pipe(
        tap((webhook) => this.webhook.set(webhook)),
        switchMap((webhook) => this.providersService.getById(webhook.provider_id)),
        tap((provider) => this.providerName.set(provider.name)),
        switchMap((provider) => this.applicationsService.getById(provider.application_id)),
      )
      .subscribe({
        next: (application) => this.applicationName.set(application.name),
      });
  }

  loadLogs(): void {
    this.loading.set(true);

    this.webhookLogsService
      .list(this.webhookId, this.currentPage(), this.currentLimit(), this.searchTerm().trim())
      .subscribe({
        next: (res) => {
          this.logs.set(res.items ?? []);
          this.pageInfo.set(res.page_info ?? null);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);

    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage.set(1);
      this.loadLogs();
    }, 400);
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

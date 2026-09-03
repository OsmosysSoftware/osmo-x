import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Table, TableModule } from '@openng/optimus-ui/table';
import { TagModule } from '@openng/optimus-ui/tag';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { SelectModule } from '@openng/optimus-ui/select';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { ConfirmDialogModule } from '@openng/optimus-ui/confirmdialog';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { ToolbarModule } from '@openng/optimus-ui/toolbar';
import { IconFieldModule } from '@openng/optimus-ui/iconfield';
import { InputIconModule } from '@openng/optimus-ui/inputicon';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { OrgContextService } from '../../../core/services/org-context.service';
import { WebhooksService } from '../services/webhooks.service';
import { ProvidersService } from '../../providers/services/providers.service';
import { Webhook, Provider, PageInfo } from '../../../core/models/api.model';

@Component({
  selector: 'app-webhooks-list',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    ConfirmDialogModule,
    TooltipModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    PaginationComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './webhooks-list.html',
  styleUrl: './webhooks-list.scss',
})
export class WebhooksListComponent implements OnInit {
  private readonly webhooksService = inject(WebhooksService);
  private readonly providersService = inject(ProvidersService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  readonly orgContext = inject(OrgContextService);

  readonly dt = viewChild<Table>('dt');

  readonly providers = signal<Provider[]>([]);
  readonly webhooks = signal<Webhook[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  private currentPage = 1;
  private currentLimit = 20;

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingWebhook = signal<Webhook | null>(null);
  readonly formUrl = signal('');
  readonly formProviderId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadWebhooks();
    this.loadProviders();
  }

  loadProviders(): void {
    this.providersService.list(1, 100).subscribe({
      next: (res) => this.providers.set(res.items ?? []),
    });
  }

  loadWebhooks(): void {
    this.loading.set(true);

    this.webhooksService.list(this.currentPage, this.currentLimit).subscribe({
      next: (res) => {
        this.webhooks.set(res.items ?? []);
        this.pageInfo.set(res.page_info ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: { page: number; limit: number }): void {
    this.currentPage = event.page;
    this.currentLimit = event.limit;
    this.loadWebhooks();
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getProviderName(providerId: number): string {
    const provider = this.providers().find((p) => p.provider_id === providerId);

    return provider ? provider.name : `#${providerId}`;
  }

  deliveryStatusLabel(status: number | null): string {
    switch (status) {
      case 1:
        return 'Success';
      case 2:
        return 'Failed';
      default:
        return 'No attempts yet';
    }
  }

  deliveryStatusSeverity(status: number | null): 'success' | 'danger' | 'secondary' {
    switch (status) {
      case 1:
        return 'success';
      case 2:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  viewLogs(webhook: Webhook): void {
    this.router.navigate(['/webhooks', webhook.id, 'logs']);
  }

  openCreate(): void {
    this.editingWebhook.set(null);
    this.formUrl.set('');
    this.formProviderId.set(null);
    this.dialogVisible.set(true);
  }

  openEdit(webhook: Webhook): void {
    this.editingWebhook.set(webhook);
    this.formUrl.set(webhook.webhook_url);
    this.formProviderId.set(webhook.provider_id);
    this.dialogVisible.set(true);
  }

  save(): void {
    const url = this.formUrl().trim();

    if (!url) {
      return;
    }

    this.saving.set(true);
    const editing = this.editingWebhook();

    if (editing) {
      this.webhooksService.update({ id: editing.id, webhook_url: url }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Webhook updated successfully',
          });
          this.dialogVisible.set(false);
          this.saving.set(false);
          this.loadWebhooks();
        },
        error: () => this.saving.set(false),
      });
    } else {
      const providerId = this.formProviderId();

      if (!providerId) {
        this.saving.set(false);

        return;
      }

      this.webhooksService.create({ webhook_url: url, provider_id: providerId }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: 'Webhook created successfully',
          });
          this.dialogVisible.set(false);
          this.saving.set(false);
          this.loadWebhooks();
        },
        error: () => this.saving.set(false),
      });
    }
  }

  confirmDelete(webhook: Webhook): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this webhook?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.webhooksService.delete(webhook.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Webhook deleted successfully',
            });
            this.loadWebhooks();
          },
        });
      },
    });
  }
}

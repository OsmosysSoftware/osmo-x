import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { WebhooksService } from '../services/webhooks.service';
import { ProvidersService } from '../../providers/services/providers.service';
import { Webhook, Provider } from '../../../core/models/api.model';

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

  readonly dt = viewChild<Table>('dt');

  readonly providers = signal<Provider[]>([]);
  readonly webhooks = signal<Webhook[]>([]);
  readonly selectedProviderId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingWebhook = signal<Webhook | null>(null);
  readonly formUrl = signal('');

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.providersService.list(1, 100).subscribe({
      next: (res) => {
        this.providers.set(res.items ?? []);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load providers',
        });
      },
    });
  }

  onProviderSelect(providerId: number): void {
    this.selectedProviderId.set(providerId);

    if (providerId) {
      this.loadWebhooks(providerId);
    } else {
      this.webhooks.set([]);
    }
  }

  loadWebhooks(providerId: number): void {
    this.loading.set(true);

    this.webhooksService.list(providerId).subscribe({
      next: (webhooks) => {
        this.webhooks.set(webhooks);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load webhooks',
        });
        this.loading.set(false);
      },
    });
  }

  refreshWebhooks(): void {
    const providerId = this.selectedProviderId();

    if (providerId) {
      this.loadWebhooks(providerId);
    }
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openCreate(): void {
    this.editingWebhook.set(null);
    this.formUrl.set('');
    this.dialogVisible.set(true);
  }

  openEdit(webhook: Webhook): void {
    this.editingWebhook.set(webhook);
    this.formUrl.set(webhook.webhook_url);
    this.dialogVisible.set(true);
  }

  save(): void {
    const url = this.formUrl().trim();

    if (!url) {
      return;
    }

    const providerId = this.selectedProviderId();

    if (!providerId) {
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
          this.loadWebhooks(providerId);
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.webhooksService.create({ webhook_url: url, provider_id: providerId }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: 'Webhook created successfully',
          });
          this.dialogVisible.set(false);
          this.saving.set(false);
          this.loadWebhooks(providerId);
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
        const providerId = this.selectedProviderId();

        this.webhooksService.delete(webhook.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Webhook deleted successfully',
            });

            if (providerId) {
              this.loadWebhooks(providerId);
            }
          },
        });
      },
    });
  }
}

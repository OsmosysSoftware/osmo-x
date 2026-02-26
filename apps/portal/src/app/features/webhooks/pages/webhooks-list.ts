import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { WebhooksService } from '../services/webhooks.service';
import { ProvidersService } from '../../providers/services/providers.service';
import { Webhook, Provider } from '../../../core/models/api.model';

@Component({
  selector: 'app-webhooks-list',
  imports: [
    FormsModule,
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1
            class="text-3xl font-semibold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3"
          >
            <i class="pi pi-arrow-right-arrow-left text-primary"></i>
            Webhooks
          </h1>
          <p class="text-muted-color mt-2">Manage webhook configurations</p>
        </div>
      </div>

      <p-card>
        <div class="flex items-center gap-4 mb-4">
          <div class="flex flex-col gap-2 flex-1" style="max-width: 350px">
            <label for="provider-select" class="font-semibold">Select Provider</label>
            <p-select
              id="provider-select"
              [options]="providers()"
              optionLabel="name"
              optionValue="provider_id"
              placeholder="Choose a provider"
              [ngModel]="selectedProviderId()"
              (ngModelChange)="onProviderSelect($event)"
              [filter]="true"
              filterPlaceholder="Search providers"
            />
          </div>

          @if (selectedProviderId()) {
            <div class="flex items-end">
              <p-button label="New Webhook" icon="pi pi-plus" (onClick)="openCreateDialog()" />
            </div>
          }
        </div>

        @if (!selectedProviderId()) {
          <div class="text-center py-8 text-muted-color">
            Select a provider to view its webhooks
          </div>
        } @else if (loading()) {
          <p-skeleton height="200px" />
        } @else {
          <p-table [value]="webhooks()" [tableStyle]="{ 'min-width': '50rem' }">
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>URL</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </ng-template>
            <ng-template #body let-w>
              <tr>
                <td>{{ w.webhook_id }}</td>
                <td class="max-w-xs truncate">{{ w.url }}</td>
                <td>
                  <p-tag
                    [value]="w.status === 1 ? 'Active' : 'Inactive'"
                    [severity]="w.status === 1 ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ w.created_on | date: 'short' }}</td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="4" class="text-center py-8 text-muted-color">
                  No webhooks found for this provider
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-card>
    </div>

    <!-- Create Webhook Dialog -->
    <p-dialog
      header="Create Webhook"
      [visible]="createDialogVisible()"
      (visibleChange)="createDialogVisible.set($event)"
      [modal]="true"
      [style]="{ width: '500px' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label for="webhook-url" class="font-semibold">Webhook URL</label>
          <input
            pInputText
            id="webhook-url"
            [ngModel]="createUrl()"
            (ngModelChange)="createUrl.set($event)"
            placeholder="https://example.com/webhook"
          />
        </div>
      </div>
      <ng-template #footer>
        <p-button label="Cancel" severity="secondary" (onClick)="createDialogVisible.set(false)" />
        <p-button
          label="Create"
          icon="pi pi-check"
          (onClick)="createWebhook()"
          [disabled]="saving()"
        />
      </ng-template>
    </p-dialog>
  `,
})
export class WebhooksListComponent implements OnInit {
  private readonly webhooksService = inject(WebhooksService);
  private readonly providersService = inject(ProvidersService);
  private readonly messageService = inject(MessageService);

  readonly providers = signal<Provider[]>([]);
  readonly webhooks = signal<Webhook[]>([]);
  readonly selectedProviderId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly createDialogVisible = signal(false);
  readonly createUrl = signal('');

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

  openCreateDialog(): void {
    this.createUrl.set('');
    this.createDialogVisible.set(true);
  }

  createWebhook(): void {
    const url = this.createUrl().trim();

    if (!url) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Webhook URL is required',
      });

      return;
    }

    const providerId = this.selectedProviderId();

    if (!providerId) {
      return;
    }

    this.saving.set(true);

    this.webhooksService.create({ url, provider_id: providerId }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Webhook created successfully',
        });
        this.createDialogVisible.set(false);
        this.saving.set(false);
        this.loadWebhooks(providerId);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}

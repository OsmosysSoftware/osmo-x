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
  template: `
    <div class="card">
      <p-toolbar class="mb-6">
        <ng-template #start>
          <h2 class="m-0 flex items-center gap-2">
            <i class="pi pi-arrow-right-arrow-left text-primary"></i>
            Webhooks
          </h2>
        </ng-template>
        <ng-template #end>
          @if (selectedProviderId()) {
            <p-button
              label="New Webhook"
              icon="pi pi-plus"
              severity="success"
              (onClick)="openCreate()"
            />
          }
        </ng-template>
      </p-toolbar>

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
            appendTo="body"
          />
        </div>
      </div>

      @if (!selectedProviderId()) {
        <div class="text-center py-8 text-muted-color">Select a provider to view its webhooks</div>
      } @else if (loading()) {
        <p-skeleton height="200px" />
      } @else {
        <p-table
          #dt
          [value]="webhooks()"
          [globalFilterFields]="['webhook_url']"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '50rem' }"
        >
          <ng-template #caption>
            <div class="flex items-center justify-between">
              <span class="text-muted-color">Manage webhook configurations</span>
              <div class="flex items-center gap-2">
                <p-iconfield>
                  <p-inputicon class="pi pi-search" />
                  <input
                    pInputText
                    type="text"
                    (input)="onGlobalFilter($event)"
                    placeholder="Search..."
                  />
                </p-iconfield>
                <p-button
                  icon="pi pi-refresh"
                  [rounded]="true"
                  [outlined]="true"
                  severity="secondary"
                  pTooltip="Refresh"
                  tooltipPosition="top"
                  (onClick)="refreshWebhooks()"
                />
              </div>
            </div>
          </ng-template>
          <ng-template #header>
            <tr>
              <th pSortableColumn="id" style="min-width: 6rem">ID <p-sortIcon field="id" /></th>
              <th style="min-width: 20rem">URL</th>
              <th>Status</th>
              <th pSortableColumn="created_on" style="min-width: 10rem">
                Created <p-sortIcon field="created_on" />
              </th>
              <th class="text-center" style="min-width: 8rem">Actions</th>
            </tr>
          </ng-template>
          <ng-template #body let-w>
            <tr>
              <td>{{ w.id }}</td>
              <td class="max-w-xs truncate">{{ w.webhook_url }}</td>
              <td>
                <p-tag
                  [value]="w.status === 1 ? 'Active' : 'Inactive'"
                  [severity]="w.status === 1 ? 'success' : 'danger'"
                />
              </td>
              <td>{{ w.created_on | date: 'short' }}</td>
              <td class="text-center">
                <p-button
                  icon="pi pi-pencil"
                  class="mr-2"
                  [rounded]="true"
                  [outlined]="true"
                  pTooltip="Edit"
                  tooltipPosition="top"
                  (onClick)="openEdit(w)"
                />
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  [rounded]="true"
                  [outlined]="true"
                  pTooltip="Delete"
                  tooltipPosition="top"
                  (onClick)="confirmDelete(w)"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="5" class="text-center py-8 text-muted-color">
                No webhooks found for this provider
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <!-- Create/Edit Webhook Dialog -->
    <p-dialog
      [header]="editingWebhook() ? 'Edit Webhook' : 'New Webhook'"
      [visible]="dialogVisible()"
      (visibleChange)="dialogVisible.set($event)"
      [modal]="true"
      [style]="{ width: '500px' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label for="webhook-url" class="font-semibold">Webhook URL</label>
          <input
            pInputText
            id="webhook-url"
            [ngModel]="formUrl()"
            (ngModelChange)="formUrl.set($event)"
            placeholder="https://example.com/webhook"
          />
        </div>
      </div>
      <ng-template #footer>
        <p-button
          label="Cancel"
          severity="secondary"
          [text]="true"
          (onClick)="dialogVisible.set(false)"
        />
        <p-button
          label="Save"
          icon="pi pi-check"
          (onClick)="save()"
          [disabled]="!formUrl().trim() || saving()"
          [loading]="saving()"
        />
      </ng-template>
    </p-dialog>

    <p-confirmDialog />
  `,
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

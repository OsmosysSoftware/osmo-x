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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { ProviderChainsService } from '../services/provider-chains.service';
import { ApplicationsService } from '../../applications/services/applications.service';
import { ProviderChain, Application, PageInfo } from '../../../core/models/api.model';

interface ProviderTypeOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-chains-list',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    ConfirmDialogModule,
    SelectModule,
    TooltipModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PaginationComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <p-toolbar class="mb-6">
        <ng-template #start>
          <h2 class="m-0 flex items-center gap-2">
            <i class="pi pi-link text-primary"></i>
            Provider Chains
          </h2>
        </ng-template>
        <ng-template #end>
          <p-button
            label="New Chain"
            icon="pi pi-plus"
            severity="success"
            (onClick)="openCreateDialog()"
          />
        </ng-template>
      </p-toolbar>

      @if (loading()) {
        <p-skeleton height="300px" />
      } @else {
        <p-table
          #dt
          [value]="chains()"
          [globalFilterFields]="['chain_name', 'application_id']"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '60rem' }"
        >
          <ng-template #caption>
            <div class="flex items-center justify-between">
              <span class="text-muted-color">Manage provider fallback chains</span>
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
                  (onClick)="loadChains()"
                />
              </div>
            </div>
          </ng-template>
          <ng-template #header>
            <tr>
              <th pSortableColumn="chain_id" style="min-width: 6rem">
                ID <p-sortIcon field="chain_id" />
              </th>
              <th pSortableColumn="chain_name" style="min-width: 12rem">
                Name <p-sortIcon field="chain_name" />
              </th>
              <th>Provider Type</th>
              <th pSortableColumn="application_id" style="min-width: 8rem">
                App ID <p-sortIcon field="application_id" />
              </th>
              <th>Status</th>
              <th pSortableColumn="created_on" style="min-width: 10rem">
                Created <p-sortIcon field="created_on" />
              </th>
              <th class="text-center" style="min-width: 8rem">Actions</th>
            </tr>
          </ng-template>
          <ng-template #body let-c>
            <tr>
              <td>{{ c.chain_id }}</td>
              <td>{{ c.chain_name }}</td>
              <td>{{ getProviderTypeLabel(c.provider_type) }}</td>
              <td>{{ c.application_id }}</td>
              <td>
                <p-tag
                  [value]="c.status === 1 ? 'Active' : 'Inactive'"
                  [severity]="c.status === 1 ? 'success' : 'danger'"
                />
              </td>
              <td>{{ c.created_on | date: 'short' }}</td>
              <td class="text-center">
                <p-button
                  icon="pi pi-pencil"
                  class="mr-2"
                  [rounded]="true"
                  [outlined]="true"
                  pTooltip="Edit"
                  tooltipPosition="top"
                  (onClick)="openEditDialog(c)"
                />
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  [rounded]="true"
                  [outlined]="true"
                  pTooltip="Delete"
                  tooltipPosition="top"
                  (onClick)="confirmDelete(c)"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="7" class="text-center py-8 text-muted-color">
                No provider chains found
              </td>
            </tr>
          </ng-template>
        </p-table>

        @if (pageInfo(); as pi) {
          <app-pagination [pageInfo]="pi" (pageChange)="onPageChange($event)" />
        }
      }
    </div>

    <!-- Create Dialog -->
    <p-dialog
      header="Create Provider Chain"
      [visible]="createDialogVisible()"
      (visibleChange)="createDialogVisible.set($event)"
      [modal]="true"
      [style]="{ width: '450px' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label for="create-chain-name" class="font-semibold">Chain Name</label>
          <input
            pInputText
            id="create-chain-name"
            [ngModel]="createForm().chain_name"
            (ngModelChange)="updateCreateForm('chain_name', $event)"
            placeholder="e.g. Email Fallback Chain"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="create-provider-type" class="font-semibold">Provider Type</label>
          <p-select
            id="create-provider-type"
            [options]="providerTypeOptions"
            [ngModel]="createForm().provider_type"
            (ngModelChange)="updateCreateForm('provider_type', $event)"
            optionLabel="label"
            optionValue="value"
            placeholder="Select provider type"
            appendTo="body"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="create-application" class="font-semibold">Application</label>
          <p-select
            id="create-application"
            [options]="applications()"
            [ngModel]="createForm().application_id"
            (ngModelChange)="updateCreateForm('application_id', $event)"
            optionLabel="name"
            optionValue="application_id"
            placeholder="Select application"
            [filter]="true"
            filterPlaceholder="Search applications"
            appendTo="body"
          />
        </div>
      </div>
      <ng-template #footer>
        <p-button label="Cancel" severity="secondary" (onClick)="createDialogVisible.set(false)" />
        <p-button
          label="Create"
          icon="pi pi-check"
          (onClick)="createChain()"
          [disabled]="saving() || !isCreateFormValid()"
        />
      </ng-template>
    </p-dialog>

    <!-- Edit Dialog -->
    <p-dialog
      header="Edit Provider Chain"
      [visible]="editDialogVisible()"
      (visibleChange)="editDialogVisible.set($event)"
      [modal]="true"
      [style]="{ width: '450px' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label for="edit-chain-name" class="font-semibold">Chain Name</label>
          <input
            pInputText
            id="edit-chain-name"
            [ngModel]="editForm().chain_name"
            (ngModelChange)="updateEditForm('chain_name', $event)"
            placeholder="e.g. Email Fallback Chain"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="edit-provider-type" class="font-semibold">Provider Type</label>
          <p-select
            id="edit-provider-type"
            [options]="providerTypeOptions"
            [ngModel]="editForm().provider_type"
            (ngModelChange)="updateEditForm('provider_type', $event)"
            optionLabel="label"
            optionValue="value"
            placeholder="Select provider type"
            appendTo="body"
          />
        </div>
      </div>
      <ng-template #footer>
        <p-button label="Cancel" severity="secondary" (onClick)="editDialogVisible.set(false)" />
        <p-button label="Save" icon="pi pi-check" (onClick)="updateChain()" [disabled]="saving()" />
      </ng-template>
    </p-dialog>

    <p-confirmDialog />
  `,
})
export class ChainsListComponent implements OnInit {
  private readonly service = inject(ProviderChainsService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly dt = viewChild<Table>('dt');

  readonly chains = signal<ProviderChain[]>([]);
  readonly applications = signal<Application[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  readonly createDialogVisible = signal(false);
  readonly editDialogVisible = signal(false);
  readonly createForm = signal<{
    chain_name: string;
    provider_type: number | null;
    application_id: number | null;
  }>({
    chain_name: '',
    provider_type: null,
    application_id: null,
  });
  readonly editForm = signal<{
    chain_id: number;
    chain_name: string;
    provider_type: number;
  }>({
    chain_id: 0,
    chain_name: '',
    provider_type: 0,
  });
  private currentPage = 1;

  readonly providerTypeOptions: ProviderTypeOption[] = [
    { label: 'Email', value: 1 },
    { label: 'SMS', value: 2 },
    { label: 'WhatsApp Business', value: 3 },
    { label: 'Push Notification', value: 4 },
    { label: 'Voice Call', value: 5 },
    { label: 'WhatsApp Direct', value: 6 },
    { label: 'Other', value: 0 },
  ];

  private readonly providerTypeLabelMap: Record<number, string> = {
    0: 'Other',
    1: 'Email',
    2: 'SMS',
    3: 'WhatsApp Business',
    4: 'Push',
    5: 'Voice',
    6: 'WhatsApp Direct',
  };

  ngOnInit(): void {
    this.loadChains();
    this.loadApplications();
  }

  loadChains(): void {
    this.loading.set(true);

    this.service.list(this.currentPage, 20).subscribe({
      next: (res) => {
        this.chains.set(res.items ?? []);
        this.pageInfo.set(res.page_info ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load provider chains',
        });
        this.loading.set(false);
      },
    });
  }

  loadApplications(): void {
    this.applicationsService.list(1, 100).subscribe({
      next: (res) => {
        this.applications.set(res.items ?? []);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadChains();
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getProviderTypeLabel(type: number): string {
    return this.providerTypeLabelMap[type] ?? 'Unknown';
  }

  openCreateDialog(): void {
    this.createForm.set({ chain_name: '', provider_type: null, application_id: null });
    this.createDialogVisible.set(true);
  }

  updateCreateForm(
    field: 'chain_name' | 'provider_type' | 'application_id',
    value: string | number,
  ): void {
    this.createForm.update((f) => ({ ...f, [field]: value }));
  }

  isCreateFormValid(): boolean {
    const form = this.createForm();

    return !!form.chain_name.trim() && form.provider_type !== null && !!form.application_id;
  }

  createChain(): void {
    const form = this.createForm();

    if (!this.isCreateFormValid()) {
      return;
    }

    this.saving.set(true);

    this.service
      .create({
        chain_name: form.chain_name.trim(),
        application_id: form.application_id!,
        provider_type: form.provider_type!,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Provider chain created successfully',
          });
          this.createDialogVisible.set(false);
          this.saving.set(false);
          this.loadChains();
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  openEditDialog(chain: ProviderChain): void {
    this.editForm.set({
      chain_id: chain.chain_id,
      chain_name: chain.chain_name,
      provider_type: chain.provider_type,
    });
    this.editDialogVisible.set(true);
  }

  updateEditForm(field: 'chain_name' | 'provider_type', value: string | number): void {
    this.editForm.update((f) => ({ ...f, [field]: value }));
  }

  updateChain(): void {
    this.saving.set(true);
    const form = this.editForm();

    this.service
      .update({
        chain_id: form.chain_id,
        chain_name: form.chain_name.trim(),
        provider_type: form.provider_type,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Provider chain updated successfully',
          });
          this.editDialogVisible.set(false);
          this.saving.set(false);
          this.loadChains();
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  confirmDelete(chain: ProviderChain): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${chain.chain_name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(chain.chain_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Provider chain deleted successfully',
            });
            this.loadChains();
          },
        });
      },
    });
  }
}

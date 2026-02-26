import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePipe } from '@angular/common';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { ProviderChainsService } from '../services/provider-chains.service';
import { ProviderChain, PageInfo } from '../../../core/models/api.model';

@Component({
  selector: 'app-chains-list',
  imports: [
    FormsModule,
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    ConfirmDialogModule,
    InputNumberModule,
    DatePipe,
    PaginationComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1
            class="text-3xl font-semibold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3"
          >
            <i class="pi pi-link text-primary"></i>
            Provider Chains
          </h1>
          <p class="text-muted-color mt-2">Manage provider fallback chains</p>
        </div>
        <p-button label="New Chain" icon="pi pi-plus" (onClick)="openCreateDialog()" />
      </div>

      @if (loading()) {
        <p-card>
          <p-skeleton height="300px" />
        </p-card>
      } @else {
        <p-card>
          <p-table [value]="chains()" [tableStyle]="{ 'min-width': '60rem' }">
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>Notification Type</th>
                <th>Application ID</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template #body let-c>
              <tr>
                <td>{{ c.chain_id }}</td>
                <td>{{ c.notification_type }}</td>
                <td>{{ c.application_id }}</td>
                <td>
                  <p-tag
                    [value]="c.status === 1 ? 'Active' : 'Inactive'"
                    [severity]="c.status === 1 ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ c.created_on | date: 'short' }}</td>
                <td>
                  <div class="flex gap-2">
                    <p-button
                      icon="pi pi-pencil"
                      severity="info"
                      [text]="true"
                      [rounded]="true"
                      (onClick)="openEditDialog(c)"
                    />
                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      [text]="true"
                      [rounded]="true"
                      (onClick)="confirmDelete(c)"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="6" class="text-center py-8 text-muted-color">
                  No provider chains found
                </td>
              </tr>
            </ng-template>
          </p-table>

          @if (pageInfo(); as pi) {
            <app-pagination [pageInfo]="pi" (pageChange)="onPageChange($event)" />
          }
        </p-card>
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
          <label for="create-notification-type" class="font-semibold">Notification Type</label>
          <p-inputNumber
            id="create-notification-type"
            [ngModel]="createForm().notification_type"
            (ngModelChange)="updateCreateForm('notification_type', $event)"
            [min]="0"
            placeholder="Enter notification type"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="create-application-id" class="font-semibold">Application ID</label>
          <p-inputNumber
            id="create-application-id"
            [ngModel]="createForm().application_id"
            (ngModelChange)="updateCreateForm('application_id', $event)"
            [min]="1"
            placeholder="Enter application ID"
          />
        </div>
      </div>
      <ng-template #footer>
        <p-button label="Cancel" severity="secondary" (onClick)="createDialogVisible.set(false)" />
        <p-button
          label="Create"
          icon="pi pi-check"
          (onClick)="createChain()"
          [disabled]="saving()"
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
          <label for="edit-notification-type" class="font-semibold">Notification Type</label>
          <p-inputNumber
            id="edit-notification-type"
            [ngModel]="editForm().notification_type"
            (ngModelChange)="updateEditForm('notification_type', $event)"
            [min]="0"
            placeholder="Enter notification type"
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
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly chains = signal<ProviderChain[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  readonly createDialogVisible = signal(false);
  readonly editDialogVisible = signal(false);
  readonly createForm = signal<{ notification_type: number; application_id: number }>({
    notification_type: 0,
    application_id: 0,
  });
  readonly editForm = signal<{ chain_id: number; notification_type: number }>({
    chain_id: 0,
    notification_type: 0,
  });
  private currentPage = 1;

  ngOnInit(): void {
    this.loadChains();
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

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadChains();
  }

  openCreateDialog(): void {
    this.createForm.set({ notification_type: 0, application_id: 0 });
    this.createDialogVisible.set(true);
  }

  updateCreateForm(field: 'notification_type' | 'application_id', value: number): void {
    this.createForm.update((f) => ({ ...f, [field]: value }));
  }

  createChain(): void {
    const form = this.createForm();

    if (!form.application_id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Application ID is required',
      });

      return;
    }

    this.saving.set(true);

    this.service.create(form).subscribe({
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
      notification_type: chain.notification_type,
    });
    this.editDialogVisible.set(true);
  }

  updateEditForm(field: 'notification_type', value: number): void {
    this.editForm.update((f) => ({ ...f, [field]: value }));
  }

  updateChain(): void {
    this.saving.set(true);

    this.service.update(this.editForm()).subscribe({
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
      message: `Are you sure you want to delete provider chain #${chain.chain_id}?`,
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

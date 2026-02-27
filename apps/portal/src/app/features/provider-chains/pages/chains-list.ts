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
import { CardModule } from 'primeng/card';
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
    CardModule,
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
  templateUrl: './chains-list.html',
  styleUrl: './chains-list.scss',
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

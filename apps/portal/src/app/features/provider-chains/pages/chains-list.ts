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
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
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
import { OrgContextService } from '../../../core/services/org-context.service';
import { ProviderChainsService } from '../services/provider-chains.service';
import { ChainMembersService } from '../../provider-chain-members/services/chain-members.service';
import { ProvidersService } from '../../providers/services/providers.service';
import { ApplicationsService } from '../../applications/services/applications.service';
import {
  ProviderChain,
  ProviderChainMember,
  Provider,
  Application,
  PageInfo,
  CreateProviderChainInput,
  UpdateProviderChainInput,
} from '../../../core/models/api.model';

interface ProviderTypeOption {
  label: string;
  value: number;
}

interface ChainMembersState {
  members: ProviderChainMember[];
  loading: boolean;
  orderChanged: boolean;
  saving: boolean;
}

@Component({
  selector: 'app-chains-list',
  imports: [
    FormsModule,
    DatePipe,
    DragDropModule,
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
  templateUrl: './chains-list.html',
  styleUrl: './chains-list.scss',
})
export class ChainsListComponent implements OnInit {
  private readonly service = inject(ProviderChainsService);
  private readonly membersService = inject(ChainMembersService);
  private readonly providersService = inject(ProvidersService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly orgContext = inject(OrgContextService);

  readonly dt = viewChild<Table>('dt');

  readonly chains = signal<ProviderChain[]>([]);
  readonly applications = signal<Application[]>([]);
  readonly providers = signal<Provider[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  readonly createDialogVisible = signal(false);
  readonly editDialogVisible = signal(false);
  readonly addMemberDialogVisible = signal(false);
  readonly expandedChainIds = signal<Set<number>>(new Set());
  readonly membersMap = signal<Record<number, ChainMembersState>>({});
  readonly addMemberChainId = signal<number | null>(null);
  readonly addMemberProviderId = signal<number | null>(null);
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
  private currentLimit = 20;

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
    this.loadProviders();
  }

  loadChains(): void {
    this.loading.set(true);

    this.service.list(this.currentPage, this.currentLimit).subscribe({
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
      next: (res) => this.applications.set(res.items ?? []),
    });
  }

  loadProviders(): void {
    this.providersService.list(1, 100).subscribe({
      next: (res) => this.providers.set(res.items ?? []),
    });
  }

  onPageChange(event: { page: number; limit: number }): void {
    this.currentPage = event.page;
    this.currentLimit = event.limit;
    this.loadChains();
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getProviderTypeLabel(type: number): string {
    return this.providerTypeLabelMap[type] ?? 'Unknown';
  }

  getApplicationName(applicationId: number): string {
    const app = this.applications().find((a) => a.application_id === applicationId);

    return app?.name ?? `App #${applicationId}`;
  }

  getProviderName(providerId: number): string {
    const provider = this.providers().find((p) => p.provider_id === providerId);

    return provider?.name ?? `Provider #${providerId}`;
  }

  // --- Expand / Collapse ---

  isExpanded(chainId: number): boolean {
    return this.expandedChainIds().has(chainId);
  }

  toggleExpand(chain: ProviderChain): void {
    const ids = new Set(this.expandedChainIds());

    if (ids.has(chain.chain_id)) {
      ids.delete(chain.chain_id);
    } else {
      ids.add(chain.chain_id);
      this.loadMembers(chain.chain_id);
    }

    this.expandedChainIds.set(ids);
  }

  getChainMembers(chainId: number): ChainMembersState {
    return (
      this.membersMap()[chainId] ?? {
        members: [],
        loading: true,
        orderChanged: false,
        saving: false,
      }
    );
  }

  loadMembers(chainId: number): void {
    this.membersMap.update((map) => ({
      ...map,
      [chainId]: { members: [], loading: true, orderChanged: false, saving: false },
    }));

    this.membersService.listByChain(chainId).subscribe({
      next: (res) => {
        const sorted = [...(res.items ?? [])].sort((a, b) => a.priority_order - b.priority_order);

        this.membersMap.update((map) => ({
          ...map,
          [chainId]: { members: sorted, loading: false, orderChanged: false, saving: false },
        }));
      },
      error: () => {
        this.membersMap.update((map) => ({
          ...map,
          [chainId]: { members: [], loading: false, orderChanged: false, saving: false },
        }));
      },
    });
  }

  // --- Drag and Drop ---

  onMemberDrop(chainId: number, event: CdkDragDrop<ProviderChainMember[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const state = this.getChainMembers(chainId);
    const members = [...state.members];

    moveItemInArray(members, event.previousIndex, event.currentIndex);

    this.membersMap.update((map) => ({
      ...map,
      [chainId]: { ...state, members, orderChanged: true },
    }));
  }

  savePriorityOrder(chainId: number): void {
    const state = this.getChainMembers(chainId);

    this.membersMap.update((map) => ({
      ...map,
      [chainId]: { ...state, saving: true },
    }));

    const providerOrder = state.members.map((m) => m.provider_id);

    this.membersService
      .updatePriorityOrder({ chain_id: chainId, new_provider_priority_order: providerOrder })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Priority order updated',
          });
          this.loadMembers(chainId);
        },
        error: () => {
          this.membersMap.update((map) => ({
            ...map,
            [chainId]: { ...this.getChainMembers(chainId), saving: false },
          }));
        },
      });
  }

  // --- Add Member ---

  openAddMemberDialog(chainId: number): void {
    this.addMemberChainId.set(chainId);
    this.addMemberProviderId.set(null);
    this.addMemberDialogVisible.set(true);
  }

  getAvailableProviders(chainId: number): Provider[] {
    const state = this.getChainMembers(chainId);
    const existingProviderIds = new Set(state.members.map((m) => m.provider_id));
    const chain = this.chains().find((c) => c.chain_id === chainId);

    if (!chain) {
      return [];
    }

    return this.providers().filter(
      (p) => p.application_id === chain.application_id && !existingProviderIds.has(p.provider_id),
    );
  }

  addMember(): void {
    const chainId = this.addMemberChainId();
    const providerId = this.addMemberProviderId();

    if (!chainId || !providerId) {
      return;
    }

    this.saving.set(true);

    this.membersService
      .create({ chain_id: chainId, provider_id: providerId, is_active: 1 })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Member added to chain',
          });
          this.addMemberDialogVisible.set(false);
          this.saving.set(false);
          this.loadMembers(chainId);
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  // --- Remove Member ---

  confirmRemoveMember(chainId: number, member: ProviderChainMember): void {
    this.confirmationService.confirm({
      message: `Remove "${this.getProviderName(member.provider_id)}" from this chain?`,
      header: 'Confirm Remove',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.membersService
          .delete({ chain_id: chainId, provider_id: member.provider_id })
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Member removed from chain',
              });
              this.loadMembers(chainId);
            },
          });
      },
    });
  }

  // --- Chain CRUD ---

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
        provider_type: form.provider_type! as CreateProviderChainInput['provider_type'],
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
        provider_type: form.provider_type as UpdateProviderChainInput['provider_type'],
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

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  viewChild,
  computed,
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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { OrgContextService } from '../../../core/services/org-context.service';
import { ChainMembersService } from '../services/chain-members.service';
import { ProviderChainsService } from '../../provider-chains/services/provider-chains.service';
import { ProvidersService } from '../../providers/services/providers.service';
import {
  ProviderChainMember,
  ProviderChain,
  Provider,
  PageInfo,
} from '../../../core/models/api.model';

@Component({
  selector: 'app-chain-members-list',
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
    ToggleSwitchModule,
    PaginationComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chain-members-list.html',
  styleUrl: './chain-members-list.scss',
})
export class ChainMembersListComponent implements OnInit {
  private readonly service = inject(ChainMembersService);
  private readonly chainsService = inject(ProviderChainsService);
  private readonly providersService = inject(ProvidersService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly orgContext = inject(OrgContextService);

  readonly dt = viewChild<Table>('dt');

  readonly members = signal<ProviderChainMember[]>([]);
  readonly chains = signal<ProviderChain[]>([]);
  readonly providers = signal<Provider[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  readonly createDialogVisible = signal(false);
  readonly createForm = signal<{
    chain_id: number | null;
    provider_id: number | null;
    is_active: boolean;
  }>({
    chain_id: null,
    provider_id: null,
    is_active: true,
  });
  private currentPage = 1;

  private readonly chainMap = computed(() => {
    const map = new Map<number, ProviderChain>();

    for (const c of this.chains()) {
      map.set(c.chain_id, c);
    }

    return map;
  });

  private readonly providerMap = computed(() => {
    const map = new Map<number, Provider>();

    for (const p of this.providers()) {
      map.set(p.provider_id, p);
    }

    return map;
  });

  ngOnInit(): void {
    this.loadMembers();
    this.loadChains();
    this.loadProviders();
  }

  loadMembers(): void {
    this.loading.set(true);

    this.service.list(this.currentPage, 20).subscribe({
      next: (res) => {
        this.members.set(res.items ?? []);
        this.pageInfo.set(res.page_info ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load chain members',
        });
        this.loading.set(false);
      },
    });
  }

  loadChains(): void {
    this.chainsService.list(1, 100).subscribe({
      next: (res) => this.chains.set(res.items ?? []),
    });
  }

  loadProviders(): void {
    this.providersService.list(1, 100).subscribe({
      next: (res) => this.providers.set(res.items ?? []),
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMembers();
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getChainName(chainId: number): string {
    return this.chainMap().get(chainId)?.chain_name ?? `Chain #${chainId}`;
  }

  getProviderName(providerId: number): string {
    return this.providerMap().get(providerId)?.name ?? `Provider #${providerId}`;
  }

  openCreateDialog(): void {
    this.createForm.set({ chain_id: null, provider_id: null, is_active: true });
    this.createDialogVisible.set(true);
  }

  updateCreateForm(field: 'chain_id' | 'provider_id' | 'is_active', value: number | boolean): void {
    this.createForm.update((f) => ({ ...f, [field]: value }));
  }

  isCreateFormValid(): boolean {
    const form = this.createForm();

    return form.chain_id !== null && form.provider_id !== null;
  }

  createMember(): void {
    const form = this.createForm();

    if (!this.isCreateFormValid()) {
      return;
    }

    this.saving.set(true);

    this.service
      .create({
        chain_id: form.chain_id!,
        provider_id: form.provider_id!,
        is_active: form.is_active ? 1 : 0,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Chain member added successfully',
          });
          this.createDialogVisible.set(false);
          this.saving.set(false);
          this.loadMembers();
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  confirmDelete(member: ProviderChainMember): void {
    const providerName = this.getProviderName(member.provider_id);
    const chainName = this.getChainName(member.chain_id);

    this.confirmationService.confirm({
      message: `Remove "${providerName}" from "${chainName}"?`,
      header: 'Confirm Remove',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service
          .delete({ chain_id: member.chain_id, provider_id: member.provider_id })
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Removed',
                detail: `"${providerName}" removed from chain`,
              });
              this.loadMembers();
            },
          });
      },
    });
  }
}

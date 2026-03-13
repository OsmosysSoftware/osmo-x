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
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { OrgContextService } from '../../../core/services/org-context.service';
import { ProvidersService } from '../services/providers.service';
import { MasterProvidersService } from '../services/master-providers';
import { ApplicationsService } from '../../applications/services/applications.service';
import { ChannelTypePipe } from '../../../shared/pipes/channel-type.pipe';
import { ChannelType } from '../../../core/constants/notification';
import {
  Provider,
  Application,
  MasterProvider,
  PageInfo,
  CreateProviderInput,
} from '../../../core/models/api.model';

interface ChannelOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-providers-list',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    TooltipModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    PaginationComponent,
    ChannelTypePipe,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './providers-list.html',
  styleUrl: './providers-list.scss',
})
export class ProvidersListComponent implements OnInit {
  private readonly providersService = inject(ProvidersService);
  private readonly masterProvidersService = inject(MasterProvidersService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly orgContext = inject(OrgContextService);

  readonly dt = viewChild<Table>('dt');

  readonly providers = signal<Provider[]>([]);
  readonly applications = signal<Application[]>([]);
  readonly masterProviders = signal<MasterProvider[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  private currentPage = 1;
  private currentLimit = 20;

  // Channel type dropdown options
  readonly channelOptions: ChannelOption[] = Object.entries(ChannelType).map(([key, label]) => ({
    label,
    value: Number(key),
  }));

  // Filter state
  readonly applicationOptions = signal<{ label: string; value: number }[]>([]);
  readonly selectedApplicationId = signal<number | null>(null);

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingProvider = signal<Provider | null>(null);
  readonly formName = signal('');
  readonly formChannelType = signal<number | null>(null);
  readonly formApplicationId = signal<number | null>(null);
  readonly formIsEnabled = signal(false);
  readonly configFields = signal<{ key: string; label: string; type: string }[]>([]);
  readonly configValues = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.loadProviders();
    this.loadApplications();
    this.loadMasterProviders();
  }

  loadApplications(): void {
    this.applicationsService.list(1, 100).subscribe({
      next: (res) => {
        this.applications.set(res.items ?? []);
        this.applicationOptions.set(
          (res.items ?? []).map((a) => ({ label: a.name, value: a.application_id })),
        );
      },
    });
  }

  loadMasterProviders(): void {
    this.masterProvidersService.list().subscribe({
      next: (list) => this.masterProviders.set(list),
    });
  }

  onChannelTypeChange(channelType: number | null): void {
    this.formChannelType.set(channelType);

    if (!channelType) {
      this.configFields.set([]);
      this.configValues.set({});

      return;
    }

    const master = this.masterProviders().find((mp) => mp.master_id === channelType);

    if (!master) {
      this.configFields.set([]);
      this.configValues.set({});

      return;
    }

    const fields = Object.entries(master.configuration).map(([key, descriptor]) => ({
      key,
      label: descriptor.label,
      type: descriptor.type,
    }));

    this.configFields.set(fields);
    this.configValues.set({});
  }

  updateConfigValue(key: string, value: string): void {
    this.configValues.update((prev) => ({ ...prev, [key]: value }));
  }

  loadProviders(): void {
    this.loading.set(true);
    const appId = this.selectedApplicationId() ?? undefined;

    this.providersService.list(this.currentPage, this.currentLimit, appId).subscribe({
      next: (res) => {
        this.providers.set(res.items ?? []);
        this.pageInfo.set(res.page_info ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: { page: number; limit: number }): void {
    this.currentPage = event.page;
    this.currentLimit = event.limit;
    this.loadProviders();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadProviders();
  }

  clearFilters(): void {
    this.selectedApplicationId.set(null);
    this.currentPage = 1;
    this.loadProviders();
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getApplicationName(applicationId: number): string {
    const app = this.applications().find((a) => a.application_id === applicationId);

    return app ? app.name : `#${applicationId}`;
  }

  openCreate(): void {
    this.editingProvider.set(null);
    this.formName.set('');
    this.formChannelType.set(null);
    this.formApplicationId.set(null);
    this.formIsEnabled.set(true);
    this.configFields.set([]);
    this.configValues.set({});
    this.dialogVisible.set(true);
  }

  openEdit(provider: Provider): void {
    this.editingProvider.set(provider);
    this.formName.set(provider.name);
    this.formChannelType.set(provider.channel_type);
    this.formApplicationId.set(provider.application_id);
    this.formIsEnabled.set(provider.is_enabled === 1);
    this.onChannelTypeChange(provider.channel_type);
    this.dialogVisible.set(true);
  }

  private buildConfigurationPayload(): Record<string, unknown> | null {
    const fields = this.configFields();
    const values = this.configValues();

    if (fields.length === 0) {
      return null;
    }

    const hasAnyValue = fields.some((f) => values[f.key]?.trim());

    if (!hasAnyValue) {
      return null;
    }

    const config: Record<string, unknown> = {};

    for (const field of fields) {
      const val = values[field.key]?.trim() ?? '';

      config[field.key] = field.type === 'number' ? Number(val) : val;
    }

    return config;
  }

  isFormValid(): boolean {
    const name = this.formName().trim();
    const editing = this.editingProvider();

    if (!name) {
      return false;
    }

    if (!editing) {
      if (this.formChannelType() === null || this.formApplicationId() === null) {
        return false;
      }

      // All config fields are required when creating
      const fields = this.configFields();
      const values = this.configValues();

      if (fields.length > 0 && fields.some((f) => !values[f.key]?.trim())) {
        return false;
      }
    }

    return true;
  }

  save(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.saving.set(true);
    const name = this.formName().trim();
    const editing = this.editingProvider();

    if (editing) {
      const updatePayload: Record<string, unknown> = {
        provider_id: editing.provider_id,
        name,
        is_enabled: this.formIsEnabled() ? 1 : 0,
      };

      const config = this.buildConfigurationPayload();

      if (config) {
        updatePayload['configuration'] = config;
      }

      this.providersService
        .update(updatePayload as Parameters<typeof this.providersService.update>[0])
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Updated',
              detail: `Provider "${name}" updated successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadProviders();
          },
          error: () => this.saving.set(false),
        });
    } else {
      const config = this.buildConfigurationPayload() ?? {};

      this.providersService
        .create({
          name,
          channel_type: this.formChannelType()! as CreateProviderInput['channel_type'],
          application_id: this.formApplicationId()!,
          is_enabled: this.formIsEnabled() ? 1 : 0,
          configuration: config,
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Created',
              detail: `Provider "${name}" created successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadProviders();
          },
          error: () => this.saving.set(false),
        });
    }
  }

  confirmDelete(provider: Provider): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${provider.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.providersService.delete(provider.provider_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Provider "${provider.name}" deleted successfully`,
            });
            this.loadProviders();
          },
        });
      },
    });
  }
}

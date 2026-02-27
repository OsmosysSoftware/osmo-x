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
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { OrgContextService } from '../../../core/services/org-context.service';
import { ProvidersService } from '../services/providers.service';
import { ApplicationsService } from '../../applications/services/applications.service';
import { ChannelTypePipe } from '../../../shared/pipes/channel-type.pipe';
import { ChannelType } from '../../../core/constants/notification';
import { Provider, Application, PageInfo } from '../../../core/models/api.model';

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
    TextareaModule,
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
  private readonly applicationsService = inject(ApplicationsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly orgContext = inject(OrgContextService);

  readonly dt = viewChild<Table>('dt');

  readonly providers = signal<Provider[]>([]);
  readonly applications = signal<Application[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  private currentPage = 1;

  // Channel type dropdown options
  readonly channelOptions: ChannelOption[] = Object.entries(ChannelType).map(([key, label]) => ({
    label,
    value: Number(key),
  }));

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingProvider = signal<Provider | null>(null);
  readonly formName = signal('');
  readonly formChannelType = signal<number | null>(null);
  readonly formApplicationId = signal<number | null>(null);
  readonly formIsEnabled = signal(false);
  readonly formConfiguration = signal('');

  ngOnInit(): void {
    this.loadProviders();
    this.loadApplications();
  }

  loadApplications(): void {
    this.applicationsService.list(1, 100).subscribe({
      next: (res) => this.applications.set(res.items ?? []),
    });
  }

  loadProviders(): void {
    this.loading.set(true);
    this.providersService.list(this.currentPage, 20).subscribe({
      next: (res) => {
        this.providers.set(res.items ?? []);
        this.pageInfo.set(res.page_info ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
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
    this.formConfiguration.set('');
    this.dialogVisible.set(true);
  }

  openEdit(provider: Provider): void {
    this.editingProvider.set(provider);
    this.formName.set(provider.name);
    this.formChannelType.set(provider.channel_type);
    this.formApplicationId.set(provider.application_id);
    this.formIsEnabled.set(provider.is_enabled === 1);
    this.formConfiguration.set(JSON.stringify(provider.configuration, null, 2));
    this.dialogVisible.set(true);
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
    }

    // Validate JSON configuration if provided
    const configStr = this.formConfiguration().trim();

    if (configStr) {
      try {
        JSON.parse(configStr);
      } catch {
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
    const configStr = this.formConfiguration().trim();
    const configuration = configStr ? (JSON.parse(configStr) as Record<string, unknown>) : {};
    const editing = this.editingProvider();

    if (editing) {
      this.providersService
        .update({
          provider_id: editing.provider_id,
          name,
          is_enabled: this.formIsEnabled() ? 1 : 0,
          configuration,
        })
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
      this.providersService
        .create({
          name,
          channel_type: this.formChannelType()!,
          application_id: this.formApplicationId()!,
          is_enabled: this.formIsEnabled() ? 1 : 0,
          configuration,
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

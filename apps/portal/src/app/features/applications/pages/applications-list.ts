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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { OrgContextService } from '../../../core/services/org-context.service';
import { ApplicationsService } from '../services/applications.service';
import { ProvidersService } from '../../providers/services/providers.service';
import { ChannelTypePipe } from '../../../shared/pipes/channel-type.pipe';
import { Application, Provider, PageInfo } from '../../../core/models/api.model';

interface WhitelistRow {
  providerId: number | null;
  recipients: string[];
}

@Component({
  selector: 'app-applications-list',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    ToggleSwitchModule,
    SelectModule,
    AutoCompleteModule,
    ConfirmDialogModule,
    TooltipModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    PaginationComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './applications-list.html',
  styleUrl: './applications-list.scss',
})
export class ApplicationsListComponent implements OnInit {
  private readonly applicationsService = inject(ApplicationsService);
  private readonly providersService = inject(ProvidersService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly orgContext = inject(OrgContextService);

  readonly dt = viewChild<Table>('dt');

  readonly applications = signal<Application[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  private currentPage = 1;

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingApp = signal<Application | null>(null);
  readonly formName = signal('');
  readonly formTestMode = signal(false);
  readonly whitelistRows = signal<WhitelistRow[]>([]);
  readonly appProviders = signal<Provider[]>([]);

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading.set(true);
    this.applicationsService.list(this.currentPage, 20).subscribe({
      next: (res) => {
        this.applications.set(res.items ?? []);
        this.pageInfo.set(res.page_info ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplications();
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openCreate(): void {
    this.editingApp.set(null);
    this.formName.set('');
    this.formTestMode.set(false);
    this.whitelistRows.set([]);
    this.appProviders.set([]);
    this.dialogVisible.set(true);
  }

  openEdit(app: Application): void {
    this.editingApp.set(app);
    this.formName.set(app.name);
    this.formTestMode.set(!!app.test_mode_enabled);
    this.loadAppProviders(app.application_id, app.whitelist_recipients);
    this.dialogVisible.set(true);
  }

  private loadAppProviders(
    applicationId: number,
    whitelist: Record<string, string[]> | string | null | undefined,
  ): void {
    this.providersService.list(1, 100).subscribe({
      next: (res) => {
        const filtered = (res.items ?? []).filter((p) => p.application_id === applicationId);

        this.appProviders.set(filtered);

        if (whitelist && typeof whitelist === 'object') {
          const rows: WhitelistRow[] = Object.entries(whitelist).map(([key, values]) => ({
            providerId: Number(key),
            recipients: Array.isArray(values) ? values : [],
          }));

          this.whitelistRows.set(rows);
        } else {
          this.whitelistRows.set([]);
        }
      },
    });
  }

  getProviderLabel(provider: Provider): string {
    return `${provider.name} (${new ChannelTypePipe().transform(provider.channel_type)})`;
  }

  getAvailableProviders(currentRow: WhitelistRow): Provider[] {
    const usedIds = new Set(
      this.whitelistRows()
        .filter((r) => r !== currentRow && r.providerId !== null)
        .map((r) => r.providerId),
    );

    return this.appProviders().filter((p) => !usedIds.has(p.provider_id));
  }

  addWhitelistRow(): void {
    this.whitelistRows.update((rows) => [...rows, { providerId: null, recipients: [] }]);
  }

  removeWhitelistRow(index: number): void {
    this.whitelistRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  private buildWhitelistPayload(): Record<string, string[]> | null {
    const rows = this.whitelistRows().filter(
      (r) => r.providerId !== null && r.recipients.length > 0,
    );

    if (rows.length === 0) {
      return null;
    }

    const result: Record<string, string[]> = {};

    for (const row of rows) {
      result[row.providerId!.toString()] = row.recipients;
    }

    return result;
  }

  save(): void {
    const name = this.formName().trim();

    if (!name) {
      return;
    }

    this.saving.set(true);
    const editing = this.editingApp();
    const whitelist = this.formTestMode() ? this.buildWhitelistPayload() : null;

    if (editing) {
      this.applicationsService
        .update({
          application_id: editing.application_id,
          name,
          test_mode_enabled: this.formTestMode() ? 1 : 0,
          whitelist_recipients: whitelist,
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Updated',
              detail: `Application "${name}" updated successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadApplications();
          },
          error: () => this.saving.set(false),
        });
    } else {
      this.applicationsService
        .create({
          name,
          test_mode_enabled: this.formTestMode() ? 1 : 0,
          whitelist_recipients: whitelist,
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Created',
              detail: `Application "${name}" created successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadApplications();
          },
          error: () => this.saving.set(false),
        });
    }
  }

  confirmDelete(app: Application): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${app.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.applicationsService.delete(app.application_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Application "${app.name}" deleted successfully`,
            });
            this.loadApplications();
          },
        });
      },
    });
  }
}

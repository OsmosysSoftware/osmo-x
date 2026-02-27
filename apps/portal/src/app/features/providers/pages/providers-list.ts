import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
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
    CardModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    TextareaModule,
    TooltipModule,
    PaginationComponent,
    ChannelTypePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1
            class="text-3xl font-semibold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3"
          >
            <i class="pi pi-server text-primary"></i>
            Providers
          </h1>
          <p class="text-muted-color mt-2">Manage notification service providers</p>
        </div>
        <p-button label="New Provider" icon="pi pi-plus" (onClick)="openCreate()" />
      </div>

      @if (loading()) {
        <p-card>
          <p-skeleton height="300px" />
        </p-card>
      } @else {
        <p-card>
          <p-table [value]="providers()" [tableStyle]="{ 'min-width': '60rem' }">
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Channel Type</th>
                <th>Enabled</th>
                <th>Application</th>
                <th>Created</th>
                <th class="text-center">Actions</th>
              </tr>
            </ng-template>
            <ng-template #body let-p>
              <tr>
                <td>{{ p.provider_id }}</td>
                <td>{{ p.name }}</td>
                <td>{{ p.channel_type | channelType }}</td>
                <td>
                  <p-tag
                    [value]="p.is_enabled === 1 ? 'Yes' : 'No'"
                    [severity]="p.is_enabled === 1 ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ getApplicationName(p.application_id) }}</td>
                <td>{{ p.created_on | date: 'short' }}</td>
                <td class="text-center">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    pTooltip="Edit"
                    tooltipPosition="top"
                    (onClick)="openEdit(p)"
                  />
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="text-center py-8 text-muted-color">No providers found</td>
              </tr>
            </ng-template>
          </p-table>
          @if (pageInfo(); as pi) {
            <app-pagination [pageInfo]="pi" (pageChange)="onPageChange($event)" />
          }
        </p-card>
      }

      <!-- Create/Edit Dialog -->
      <p-dialog
        [visible]="dialogVisible()"
        (visibleChange)="dialogVisible.set($event)"
        [header]="editingProvider() ? 'Edit Provider' : 'New Provider'"
        [modal]="true"
        [style]="{ width: '32rem' }"
      >
        <div class="flex flex-col gap-4 mt-2">
          <div class="flex flex-col gap-2">
            <label for="provName" class="font-medium">Name</label>
            <input
              pInputText
              id="provName"
              [ngModel]="formName()"
              (ngModelChange)="formName.set($event)"
              placeholder="Provider name"
            />
          </div>
          @if (!editingProvider()) {
            <div class="flex flex-col gap-2">
              <label for="channelType" class="font-medium">Channel Type</label>
              <p-select
                id="channelType"
                [options]="channelOptions"
                [ngModel]="formChannelType()"
                (ngModelChange)="formChannelType.set($event)"
                optionLabel="label"
                optionValue="value"
                placeholder="Select a channel type"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label for="appId" class="font-medium">Application</label>
              <p-select
                id="appId"
                [options]="applications()"
                [ngModel]="formApplicationId()"
                (ngModelChange)="formApplicationId.set($event)"
                optionLabel="name"
                optionValue="application_id"
                placeholder="Select an application"
                [filter]="true"
                filterPlaceholder="Search applications"
              />
            </div>
          }
          <div class="flex items-center gap-3">
            <p-toggleSwitch
              [ngModel]="formIsEnabled()"
              (ngModelChange)="formIsEnabled.set($event)"
              inputId="isEnabled"
            />
            <label for="isEnabled" class="font-medium">Enabled</label>
          </div>
          <div class="flex flex-col gap-2">
            <label for="config" class="font-medium">Configuration (JSON)</label>
            <textarea
              pTextarea
              id="config"
              [ngModel]="formConfiguration()"
              (ngModelChange)="formConfiguration.set($event)"
              [rows]="6"
              placeholder='{"key": "value"}'
            ></textarea>
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
            [disabled]="!isFormValid()"
            [loading]="saving()"
            (onClick)="save()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class ProvidersListComponent implements OnInit {
  private readonly providersService = inject(ProvidersService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly messageService = inject(MessageService);

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
}

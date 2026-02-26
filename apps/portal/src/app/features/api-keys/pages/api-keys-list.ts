import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ApiKeysService } from '../services/api-keys.service';
import { ApplicationsService } from '../../applications/services/applications.service';
import { ServerApiKey, Application } from '../../../core/models/api.model';

@Component({
  selector: 'app-api-keys-list',
  imports: [
    FormsModule,
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    SelectModule,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1
            class="text-3xl font-semibold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3"
          >
            <i class="pi pi-key text-primary"></i>
            API Keys
          </h1>
          <p class="text-muted-color mt-2">Manage server API keys for applications</p>
        </div>
      </div>

      <p-card>
        <div class="flex items-center gap-4 mb-4">
          <div class="flex flex-col gap-2 flex-1" style="max-width: 350px">
            <label for="app-select" class="font-semibold">Select Application</label>
            <p-select
              id="app-select"
              [options]="applications()"
              optionLabel="name"
              optionValue="application_id"
              placeholder="Choose an application"
              [ngModel]="selectedApplicationId()"
              (ngModelChange)="onApplicationSelect($event)"
              [filter]="true"
              filterPlaceholder="Search applications"
            />
          </div>

          @if (selectedApplicationId()) {
            <div class="flex items-end">
              <p-button
                label="Generate API Key"
                icon="pi pi-plus"
                (onClick)="generateApiKey()"
                [disabled]="generating()"
              />
            </div>
          }
        </div>

        @if (!selectedApplicationId()) {
          <div class="text-center py-8 text-muted-color">
            Select an application to view its API keys
          </div>
        } @else if (loading()) {
          <p-skeleton height="200px" />
        } @else {
          <p-table [value]="apiKeys()" [tableStyle]="{ 'min-width': '50rem' }">
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>Masked Key</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </ng-template>
            <ng-template #body let-k>
              <tr>
                <td>{{ k.api_key_id }}</td>
                <td class="font-mono">{{ k.masked_api_key }}</td>
                <td>
                  <p-tag
                    [value]="k.status === 1 ? 'Active' : 'Revoked'"
                    [severity]="k.status === 1 ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ k.created_on | date: 'short' }}</td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="4" class="text-center py-8 text-muted-color">
                  No API keys found for this application
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </p-card>
    </div>

    <!-- Generated Key Dialog (ONE-TIME DISPLAY) -->
    <p-dialog
      header="API Key Generated"
      [visible]="keyDialogVisible()"
      (visibleChange)="keyDialogVisible.set($event)"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '550px' }"
    >
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2 text-orange-500">
          <i class="pi pi-exclamation-triangle text-xl"></i>
          <span class="font-semibold">Copy this key now. It will not be shown again.</span>
        </div>
        <div
          class="bg-surface-100 dark:bg-surface-800 p-4 rounded-lg font-mono text-sm break-all select-all"
        >
          {{ generatedKey() }}
        </div>
      </div>
      <ng-template #footer>
        <p-button label="Close" (onClick)="keyDialogVisible.set(false)" />
      </ng-template>
    </p-dialog>
  `,
})
export class ApiKeysListComponent implements OnInit {
  private readonly apiKeysService = inject(ApiKeysService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly messageService = inject(MessageService);

  readonly applications = signal<Application[]>([]);
  readonly apiKeys = signal<ServerApiKey[]>([]);
  readonly selectedApplicationId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly generating = signal(false);
  readonly keyDialogVisible = signal(false);
  readonly generatedKey = signal('');

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.applicationsService.list(1, 100).subscribe({
      next: (res) => {
        this.applications.set(res.items ?? []);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load applications',
        });
      },
    });
  }

  onApplicationSelect(applicationId: number): void {
    this.selectedApplicationId.set(applicationId);

    if (applicationId) {
      this.loadApiKeys(applicationId);
    } else {
      this.apiKeys.set([]);
    }
  }

  loadApiKeys(applicationId: number): void {
    this.loading.set(true);

    this.apiKeysService.list(applicationId).subscribe({
      next: (keys) => {
        this.apiKeys.set(keys);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load API keys',
        });
        this.loading.set(false);
      },
    });
  }

  generateApiKey(): void {
    const appId = this.selectedApplicationId();

    if (!appId) {
      return;
    }

    this.generating.set(true);

    this.apiKeysService.generate(appId).subscribe({
      next: (key) => {
        this.generatedKey.set(key);
        this.keyDialogVisible.set(true);
        this.generating.set(false);
        this.loadApiKeys(appId);
      },
      error: () => {
        this.generating.set(false);
      },
    });
  }
}

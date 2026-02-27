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
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApiKeysService } from '../services/api-keys.service';
import { ApplicationsService } from '../../applications/services/applications.service';
import { ServerApiKey, Application } from '../../../core/models/api.model';

@Component({
  selector: 'app-api-keys-list',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    ConfirmDialogModule,
    TooltipModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './api-keys-list.html',
  styleUrl: './api-keys-list.scss',
})
export class ApiKeysListComponent implements OnInit {
  private readonly apiKeysService = inject(ApiKeysService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly dt = viewChild<Table>('dt');

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

  refreshApiKeys(): void {
    const appId = this.selectedApplicationId();

    if (appId) {
      this.loadApiKeys(appId);
    }
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
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

  confirmRevoke(key: ServerApiKey): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to revoke API key "${key.masked_api_key}"?`,
      header: 'Confirm Revoke',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const appId = this.selectedApplicationId();

        this.apiKeysService.revoke(key.api_key_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Revoked',
              detail: 'API key revoked successfully',
            });

            if (appId) {
              this.loadApiKeys(appId);
            }
          },
        });
      },
    });
  }
}

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
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { OrgContextService } from '../../../core/services/org-context.service';
import { ApiKeysService } from '../services/api-keys.service';
import { ApplicationsService } from '../../applications/services/applications.service';
import { ServerApiKey, Application, PageInfo } from '../../../core/models/api.model';

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
    PaginationComponent,
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
  readonly orgContext = inject(OrgContextService);

  readonly dt = viewChild<Table>('dt');

  readonly applications = signal<Application[]>([]);
  readonly apiKeys = signal<ServerApiKey[]>([]);
  readonly loading = signal(true);
  readonly generating = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  private currentPage = 1;

  // Generate dialog state
  readonly generateDialogVisible = signal(false);
  readonly formApplicationId = signal<number | null>(null);
  readonly keyDialogVisible = signal(false);
  readonly generatedKey = signal('');

  ngOnInit(): void {
    this.loadApiKeys();
    this.loadApplications();
  }

  loadApplications(): void {
    this.applicationsService.list(1, 100).subscribe({
      next: (res) => this.applications.set(res.items ?? []),
    });
  }

  loadApiKeys(): void {
    this.loading.set(true);

    this.apiKeysService.list(this.currentPage, 20).subscribe({
      next: (res) => {
        this.apiKeys.set(res.items ?? []);
        this.pageInfo.set(res.page_info ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApiKeys();
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getApplicationName(applicationId: number): string {
    const app = this.applications().find((a) => a.application_id === applicationId);

    return app ? app.name : `#${applicationId}`;
  }

  openGenerate(): void {
    this.formApplicationId.set(null);
    this.generateDialogVisible.set(true);
  }

  generateApiKey(): void {
    const appId = this.formApplicationId();

    if (!appId) {
      return;
    }

    this.generating.set(true);

    this.apiKeysService.generate(appId).subscribe({
      next: (key) => {
        this.generatedKey.set(key);
        this.generateDialogVisible.set(false);
        this.keyDialogVisible.set(true);
        this.generating.set(false);
        this.loadApiKeys();
      },
      error: () => this.generating.set(false),
    });
  }

  copyKey(): void {
    navigator.clipboard.writeText(this.generatedKey()).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'API key copied to clipboard',
      });
    });
  }

  confirmRevoke(key: ServerApiKey): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to revoke API key "${key.masked_api_key}"?`,
      header: 'Confirm Revoke',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.apiKeysService.revoke(key.api_key_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Revoked',
              detail: 'API key revoked successfully',
            });
            this.loadApiKeys();
          },
        });
      },
    });
  }
}

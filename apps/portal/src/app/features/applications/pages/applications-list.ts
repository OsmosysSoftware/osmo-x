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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { ApplicationsService } from '../services/applications.service';
import { Application, PageInfo } from '../../../core/models/api.model';

@Component({
  selector: 'app-applications-list',
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
    ToggleSwitchModule,
    ConfirmDialogModule,
    TooltipModule,
    PaginationComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1
            class="text-3xl font-semibold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3"
          >
            <i class="pi pi-th-large text-primary"></i>
            Applications
          </h1>
          <p class="text-muted-color mt-2">Manage your notification applications</p>
        </div>
        <p-button label="New Application" icon="pi pi-plus" (onClick)="openCreate()" />
      </div>

      @if (loading()) {
        <p-card>
          <p-skeleton height="300px" />
        </p-card>
      } @else {
        <p-card>
          <p-table [value]="applications()" [tableStyle]="{ 'min-width': '50rem' }">
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Test Mode</th>
                <th>Created</th>
                <th class="text-center">Actions</th>
              </tr>
            </ng-template>
            <ng-template #body let-app>
              <tr>
                <td>{{ app.application_id }}</td>
                <td>{{ app.name }}</td>
                <td>
                  <p-tag
                    [value]="app.status === 1 ? 'Active' : 'Inactive'"
                    [severity]="app.status === 1 ? 'success' : 'danger'"
                  />
                </td>
                <td>
                  <p-tag
                    [value]="app.test_mode_enabled ? 'On' : 'Off'"
                    [severity]="app.test_mode_enabled ? 'warn' : 'secondary'"
                  />
                </td>
                <td>{{ app.created_on | date: 'short' }}</td>
                <td class="text-center">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    pTooltip="Edit"
                    tooltipPosition="top"
                    (onClick)="openEdit(app)"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    pTooltip="Delete"
                    tooltipPosition="top"
                    (onClick)="confirmDelete(app)"
                  />
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="6" class="text-center py-8 text-muted-color">No applications found</td>
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
        [header]="editingApp() ? 'Edit Application' : 'New Application'"
        [modal]="true"
        [style]="{ width: '28rem' }"
      >
        <div class="flex flex-col gap-4 mt-2">
          <div class="flex flex-col gap-2">
            <label for="appName" class="font-medium">Name</label>
            <input
              pInputText
              id="appName"
              [ngModel]="formName()"
              (ngModelChange)="formName.set($event)"
              placeholder="Application name"
            />
          </div>
          <div class="flex items-center gap-3">
            <p-toggleSwitch
              [ngModel]="formTestMode()"
              (ngModelChange)="formTestMode.set($event)"
              inputId="testMode"
            />
            <label for="testMode" class="font-medium">Test Mode</label>
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
            [disabled]="!formName().trim()"
            [loading]="saving()"
            (onClick)="save()"
          />
        </ng-template>
      </p-dialog>

      <p-confirmDialog />
    </div>
  `,
})
export class ApplicationsListComponent implements OnInit {
  private readonly applicationsService = inject(ApplicationsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

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

  openCreate(): void {
    this.editingApp.set(null);
    this.formName.set('');
    this.formTestMode.set(false);
    this.dialogVisible.set(true);
  }

  openEdit(app: Application): void {
    this.editingApp.set(app);
    this.formName.set(app.name);
    this.formTestMode.set(app.test_mode_enabled);
    this.dialogVisible.set(true);
  }

  save(): void {
    const name = this.formName().trim();

    if (!name) {
      return;
    }

    this.saving.set(true);
    const editing = this.editingApp();

    if (editing) {
      this.applicationsService
        .update({
          application_id: editing.application_id,
          name,
          test_mode_enabled: this.formTestMode(),
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
      this.applicationsService.create({ name, test_mode_enabled: this.formTestMode() }).subscribe({
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

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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
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
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    ToggleSwitchModule,
    ConfirmDialogModule,
    TooltipModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    PaginationComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <p-toolbar class="mb-6">
        <ng-template #start>
          <h2 class="m-0 flex items-center gap-2">
            <i class="pi pi-th-large text-primary"></i>
            Applications
          </h2>
        </ng-template>
        <ng-template #end>
          <p-button
            label="New Application"
            icon="pi pi-plus"
            severity="success"
            (onClick)="openCreate()"
          />
        </ng-template>
      </p-toolbar>

      @if (loading()) {
        <p-skeleton height="300px" />
      } @else {
        <p-table
          #dt
          [value]="applications()"
          [globalFilterFields]="['name']"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '50rem' }"
        >
          <ng-template #caption>
            <div class="flex items-center justify-between">
              <span class="text-muted-color">Manage your notification applications</span>
              <div class="flex items-center gap-2">
                <p-iconfield>
                  <p-inputicon class="pi pi-search" />
                  <input
                    pInputText
                    type="text"
                    (input)="onGlobalFilter($event)"
                    placeholder="Search..."
                  />
                </p-iconfield>
                <p-button
                  icon="pi pi-refresh"
                  [rounded]="true"
                  [outlined]="true"
                  severity="secondary"
                  pTooltip="Refresh"
                  tooltipPosition="top"
                  (onClick)="loadApplications()"
                />
              </div>
            </div>
          </ng-template>
          <ng-template #header>
            <tr>
              <th pSortableColumn="application_id" style="min-width: 6rem">
                ID <p-sortIcon field="application_id" />
              </th>
              <th pSortableColumn="name" style="min-width: 12rem">
                Name <p-sortIcon field="name" />
              </th>
              <th>Status</th>
              <th>Test Mode</th>
              <th pSortableColumn="created_on" style="min-width: 10rem">
                Created <p-sortIcon field="created_on" />
              </th>
              <th class="text-center" style="min-width: 8rem">Actions</th>
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
                  class="mr-2"
                  [rounded]="true"
                  [outlined]="true"
                  pTooltip="Edit"
                  tooltipPosition="top"
                  (onClick)="openEdit(app)"
                />
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  [rounded]="true"
                  [outlined]="true"
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

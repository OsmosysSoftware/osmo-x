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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OrganizationsService } from '../services/organizations.service';
import { Organization } from '../../../core/models/api.model';

@Component({
  selector: 'app-organizations-list',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    ConfirmDialogModule,
    TooltipModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <p-toolbar class="mb-6">
        <ng-template #start>
          <h2 class="m-0 flex items-center gap-2">
            <i class="pi pi-building text-primary"></i>
            Organizations
          </h2>
        </ng-template>
        <ng-template #end>
          <p-button
            label="New Organization"
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
          [value]="organizations()"
          [rows]="10"
          [paginator]="true"
          [globalFilterFields]="['name', 'slug']"
          [rowHover]="true"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} organizations"
          [rowsPerPageOptions]="[10, 20, 50]"
          [tableStyle]="{ 'min-width': '50rem' }"
        >
          <ng-template #caption>
            <div class="flex items-center justify-between">
              <span class="text-muted-color">Manage platform organizations</span>
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
                  (onClick)="loadOrganizations()"
                />
              </div>
            </div>
          </ng-template>
          <ng-template #header>
            <tr>
              <th pSortableColumn="organization_id" style="min-width: 6rem">
                ID <p-sortIcon field="organization_id" />
              </th>
              <th pSortableColumn="name" style="min-width: 12rem">
                Name <p-sortIcon field="name" />
              </th>
              <th pSortableColumn="slug" style="min-width: 10rem">
                Slug <p-sortIcon field="slug" />
              </th>
              <th>Status</th>
              <th pSortableColumn="created_on" style="min-width: 10rem">
                Created <p-sortIcon field="created_on" />
              </th>
              <th class="text-center" style="min-width: 8rem">Actions</th>
            </tr>
          </ng-template>
          <ng-template #body let-org>
            <tr>
              <td>{{ org.organization_id }}</td>
              <td>{{ org.name }}</td>
              <td class="font-mono">{{ org.slug }}</td>
              <td>
                <p-tag
                  [value]="org.status === 1 ? 'Active' : 'Inactive'"
                  [severity]="org.status === 1 ? 'success' : 'danger'"
                />
              </td>
              <td>{{ org.created_on | date: 'short' }}</td>
              <td class="text-center">
                <p-button
                  icon="pi pi-pencil"
                  class="mr-2"
                  [rounded]="true"
                  [outlined]="true"
                  pTooltip="Edit"
                  tooltipPosition="top"
                  (onClick)="openEdit(org)"
                />
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  [rounded]="true"
                  [outlined]="true"
                  pTooltip="Delete"
                  tooltipPosition="top"
                  (onClick)="confirmDelete(org)"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="6" class="text-center py-8 text-muted-color">No organizations found</td>
            </tr>
          </ng-template>
        </p-table>
      }

      <!-- Create/Edit Organization Dialog -->
      <p-dialog
        [visible]="dialogVisible()"
        (visibleChange)="dialogVisible.set($event)"
        [header]="editingOrg() ? 'Edit Organization' : 'New Organization'"
        [modal]="true"
        [style]="{ width: '28rem' }"
      >
        <div class="flex flex-col gap-4 mt-2">
          <div class="flex flex-col gap-2">
            <label for="orgName" class="font-medium">Name</label>
            <input
              pInputText
              id="orgName"
              [ngModel]="formName()"
              (ngModelChange)="onNameChange($event)"
              placeholder="Organization name"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="orgSlug" class="font-medium">Slug</label>
            <input
              pInputText
              id="orgSlug"
              [ngModel]="formSlug()"
              (ngModelChange)="formSlug.set($event)"
              placeholder="organization-slug"
              class="font-mono"
            />
            <small class="text-muted-color"
              >URL-friendly identifier (lowercase, alphanumeric, hyphens)</small
            >
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

      <p-confirmDialog />
    </div>
  `,
})
export class OrganizationsListComponent implements OnInit {
  private readonly service = inject(OrganizationsService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly dt = viewChild<Table>('dt');

  readonly organizations = signal<Organization[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  // Dialog state
  readonly dialogVisible = signal(false);
  readonly editingOrg = signal<Organization | null>(null);
  readonly formName = signal('');
  readonly formSlug = signal('');

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations(): void {
    this.loading.set(true);

    this.service.list().subscribe({
      next: (organizations) => {
        this.organizations.set(organizations);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load organizations',
        });
        this.loading.set(false);
      },
    });
  }

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openCreate(): void {
    this.editingOrg.set(null);
    this.formName.set('');
    this.formSlug.set('');
    this.dialogVisible.set(true);
  }

  openEdit(org: Organization): void {
    this.editingOrg.set(org);
    this.formName.set(org.name);
    this.formSlug.set(org.slug);
    this.dialogVisible.set(true);
  }

  onNameChange(name: string): void {
    this.formName.set(name);

    // Auto-generate slug only when creating
    if (!this.editingOrg()) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      this.formSlug.set(slug);
    }
  }

  isFormValid(): boolean {
    const name = this.formName().trim();
    const slug = this.formSlug().trim();

    if (!name || !slug) {
      return false;
    }

    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  save(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.saving.set(true);
    const editing = this.editingOrg();

    if (editing) {
      this.service
        .update({
          organization_id: editing.organization_id,
          name: this.formName().trim(),
          slug: this.formSlug().trim(),
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Updated',
              detail: `Organization "${this.formName().trim()}" updated successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadOrganizations();
          },
          error: () => this.saving.set(false),
        });
    } else {
      this.service
        .create({
          name: this.formName().trim(),
          slug: this.formSlug().trim(),
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Created',
              detail: `Organization "${this.formName().trim()}" created successfully`,
            });
            this.dialogVisible.set(false);
            this.saving.set(false);
            this.loadOrganizations();
          },
          error: () => this.saving.set(false),
        });
    }
  }

  confirmDelete(org: Organization): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${org.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(org.organization_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Organization "${org.name}" deleted successfully`,
            });
            this.loadOrganizations();
          },
        });
      },
    });
  }
}

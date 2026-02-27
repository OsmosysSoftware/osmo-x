import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { OrganizationsService } from '../services/organizations.service';
import { Organization } from '../../../core/models/api.model';

@Component({
  selector: 'app-organizations-list',
  imports: [
    FormsModule,
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
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
            <i class="pi pi-building text-primary"></i>
            Organizations
          </h1>
          <p class="text-muted-color mt-2">Manage platform organizations</p>
        </div>
        <p-button label="New Organization" icon="pi pi-plus" (onClick)="openCreate()" />
      </div>

      @if (loading()) {
        <p-card>
          <p-skeleton height="300px" />
        </p-card>
      } @else {
        <p-card>
          <p-table [value]="organizations()" [tableStyle]="{ 'min-width': '50rem' }">
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created</th>
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
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="5" class="text-center py-8 text-muted-color">
                  No organizations found
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      }

      <!-- Create Organization Dialog -->
      <p-dialog
        [visible]="dialogVisible()"
        (visibleChange)="dialogVisible.set($event)"
        header="New Organization"
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
            label="Create"
            icon="pi pi-check"
            [disabled]="!isFormValid()"
            [loading]="saving()"
            (onClick)="createOrganization()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class OrganizationsListComponent implements OnInit {
  private readonly service = inject(OrganizationsService);
  private readonly messageService = inject(MessageService);

  readonly organizations = signal<Organization[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  // Dialog state
  readonly dialogVisible = signal(false);
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

  openCreate(): void {
    this.formName.set('');
    this.formSlug.set('');
    this.dialogVisible.set(true);
  }

  onNameChange(name: string): void {
    this.formName.set(name);

    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    this.formSlug.set(slug);
  }

  isFormValid(): boolean {
    const name = this.formName().trim();
    const slug = this.formSlug().trim();

    if (!name || !slug) {
      return false;
    }

    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  createOrganization(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.saving.set(true);

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

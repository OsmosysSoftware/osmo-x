import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { OrganizationsService } from '../services/organizations.service';
import { Organization } from '../../../core/models/api.model';

@Component({
  selector: 'app-organizations-list',
  imports: [TableModule, CardModule, TagModule, SkeletonModule, DatePipe],
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
    </div>
  `,
})
export class OrganizationsListComponent implements OnInit {
  private readonly service = inject(OrganizationsService);
  private readonly messageService = inject(MessageService);

  readonly organizations = signal<Organization[]>([]);
  readonly loading = signal(true);

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
}

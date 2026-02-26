import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-applications-list',
  imports: [
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DatePipe,
    PaginationComponent,
  ],
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
                    [value]="app.is_test_mode_on ? 'On' : 'Off'"
                    [severity]="app.is_test_mode_on ? 'warn' : 'secondary'"
                  />
                </td>
                <td>{{ app.created_on | date: 'short' }}</td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="5" class="text-center py-8 text-muted-color">No applications found</td>
              </tr>
            </ng-template>
          </p-table>
          @if (pageInfo(); as pi) {
            <app-pagination [pageInfo]="pi" (pageChange)="onPageChange($event)" />
          }
        </p-card>
      }
    </div>
  `,
})
export class ApplicationsListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/applications`;

  readonly applications = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);
  readonly pageInfo = signal<{
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  } | null>(null);
  private currentPage = 1;

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading.set(true);
    this.http
      .get<{
        items: Record<string, unknown>[];
        page_info: { page: number; limit: number; total_items: number; total_pages: number };
      }>(this.apiUrl, { params: { page: this.currentPage, limit: 20 } })
      .subscribe({
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
}

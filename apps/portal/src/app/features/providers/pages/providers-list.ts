import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-providers-list',
  imports: [TableModule, CardModule, TagModule, SkeletonModule, DatePipe, PaginationComponent],
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
      </div>

      @if (loading()) {
        <p-card>
          <p-skeleton height="300px" />
        </p-card>
      } @else {
        <p-card>
          <p-table [value]="providers()" [tableStyle]="{ 'min-width': '50rem' }">
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Application</th>
                <th>Created</th>
              </tr>
            </ng-template>
            <ng-template #body let-p>
              <tr>
                <td>{{ p.provider_id }}</td>
                <td>{{ p.name }}</td>
                <td>{{ p.channel_type }}</td>
                <td>
                  <p-tag
                    [value]="p.status === 1 ? 'Active' : 'Inactive'"
                    [severity]="p.status === 1 ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ p.application_id }}</td>
                <td>{{ p.created_on | date: 'short' }}</td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="6" class="text-center py-8 text-muted-color">No providers found</td>
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
export class ProvidersListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/providers`;

  readonly providers = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);
  readonly pageInfo = signal<{
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  } | null>(null);
  private currentPage = 1;

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.loading.set(true);
    this.http
      .get<{
        items: Record<string, unknown>[];
        page_info: { page: number; limit: number; total_items: number; total_pages: number };
      }>(this.apiUrl, { params: { page: this.currentPage, limit: 20 } })
      .subscribe({
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
}

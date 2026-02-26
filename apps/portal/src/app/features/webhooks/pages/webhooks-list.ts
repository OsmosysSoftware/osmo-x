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
  selector: 'app-webhooks-list',
  imports: [TableModule, CardModule, TagModule, SkeletonModule, DatePipe, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1
            class="text-3xl font-semibold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3"
          >
            <i class="pi pi-arrow-right-arrow-left text-primary"></i>
            Webhooks
          </h1>
          <p class="text-muted-color mt-2">Manage webhook configurations</p>
        </div>
      </div>

      @if (loading()) {
        <p-card>
          <p-skeleton height="300px" />
        </p-card>
      } @else {
        <p-card>
          <p-table [value]="webhooks()" [tableStyle]="{ 'min-width': '50rem' }">
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>URL</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </ng-template>
            <ng-template #body let-w>
              <tr>
                <td>{{ w.webhook_id }}</td>
                <td class="max-w-xs truncate">{{ w.url }}</td>
                <td>{{ w.provider_id }}</td>
                <td>
                  <p-tag
                    [value]="w.status === 1 ? 'Active' : 'Inactive'"
                    [severity]="w.status === 1 ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ w.created_on | date: 'short' }}</td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="5" class="text-center py-8 text-muted-color">No webhooks found</td>
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
export class WebhooksListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/webhooks`;

  readonly webhooks = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);
  readonly pageInfo = signal<{
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  } | null>(null);
  private currentPage = 1;

  ngOnInit(): void {
    this.loadWebhooks();
  }

  loadWebhooks(): void {
    this.loading.set(true);
    this.http
      .get<{
        items: Record<string, unknown>[];
        page_info: { page: number; limit: number; total_items: number; total_pages: number };
      }>(this.apiUrl, { params: { page: this.currentPage, limit: 20 } })
      .subscribe({
        next: (res) => {
          this.webhooks.set(res.items ?? []);
          this.pageInfo.set(res.page_info ?? null);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadWebhooks();
  }
}

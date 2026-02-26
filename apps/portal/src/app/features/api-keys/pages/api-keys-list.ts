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
  selector: 'app-api-keys-list',
  imports: [TableModule, CardModule, TagModule, SkeletonModule, DatePipe, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1
            class="text-3xl font-semibold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3"
          >
            <i class="pi pi-key text-primary"></i>
            API Keys
          </h1>
          <p class="text-muted-color mt-2">Manage server API keys for applications</p>
        </div>
      </div>

      @if (loading()) {
        <p-card>
          <p-skeleton height="300px" />
        </p-card>
      } @else {
        <p-card>
          <p-table [value]="apiKeys()" [tableStyle]="{ 'min-width': '50rem' }">
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>Key (Masked)</th>
                <th>Application</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </ng-template>
            <ng-template #body let-k>
              <tr>
                <td>{{ k.server_api_key_id }}</td>
                <td class="font-mono">{{ maskKey(k.api_key) }}</td>
                <td>{{ k.application_id }}</td>
                <td>
                  <p-tag
                    [value]="k.status === 1 ? 'Active' : 'Revoked'"
                    [severity]="k.status === 1 ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ k.created_on | date: 'short' }}</td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="5" class="text-center py-8 text-muted-color">No API keys found</td>
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
export class ApiKeysListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/api-keys`;

  readonly apiKeys = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);
  readonly pageInfo = signal<{
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  } | null>(null);
  private currentPage = 1;

  ngOnInit(): void {
    this.loadApiKeys();
  }

  loadApiKeys(): void {
    this.loading.set(true);
    this.http
      .get<{
        items: Record<string, unknown>[];
        page_info: { page: number; limit: number; total_items: number; total_pages: number };
      }>(this.apiUrl, { params: { page: this.currentPage, limit: 20 } })
      .subscribe({
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

  maskKey(key: string): string {
    if (!key || key.length < 8) {
      return '****';
    }

    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  }
}

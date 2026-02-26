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
  selector: 'app-archived-list',
  imports: [TableModule, CardModule, TagModule, SkeletonModule, DatePipe, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1
            class="text-3xl font-semibold text-surface-900 dark:text-surface-0 m-0 flex items-center gap-3"
          >
            <i class="pi pi-inbox text-primary"></i>
            Archived Notifications
          </h1>
          <p class="text-muted-color mt-2">View completed and archived notifications</p>
        </div>
      </div>

      @if (loading()) {
        <p-card>
          <p-skeleton height="300px" />
        </p-card>
      } @else {
        <p-card>
          <p-table [value]="notifications()" [tableStyle]="{ 'min-width': '60rem' }">
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Application</th>
                <th>Archived On</th>
              </tr>
            </ng-template>
            <ng-template #body let-n>
              <tr>
                <td>{{ n.archived_notification_id || n.notification_id }}</td>
                <td>{{ n.channel_type }}</td>
                <td>
                  <p-tag
                    [value]="n.delivery_status"
                    [severity]="n.delivery_status === 'SUCCESS' ? 'success' : 'danger'"
                  />
                </td>
                <td>{{ n.application_id }}</td>
                <td>{{ n.created_on | date: 'short' }}</td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="5" class="text-center py-8 text-muted-color">
                  No archived notifications found
                </td>
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
export class ArchivedListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/archived-notifications`;

  readonly notifications = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(true);
  readonly pageInfo = signal<{
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  } | null>(null);
  private currentPage = 1;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.http
      .get<{
        items: Record<string, unknown>[];
        page_info: { page: number; limit: number; total_items: number; total_pages: number };
      }>(this.apiUrl, { params: { page: this.currentPage, limit: 20 } })
      .subscribe({
        next: (res) => {
          this.notifications.set(res.items ?? []);
          this.pageInfo.set(res.page_info ?? null);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }
}

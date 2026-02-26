import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { DatePipe, JsonPipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { ChannelTypePipe } from '../../../shared/pipes/channel-type.pipe';
import { ArchivedNotificationsService } from '../services/archived-notifications.service';
import { ArchivedNotification, PageInfo } from '../../../core/models/api.model';

@Component({
  selector: 'app-archived-list',
  imports: [
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    DatePipe,
    JsonPipe,
    PaginationComponent,
    StatusBadgeComponent,
    ChannelTypePipe,
  ],
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
          <p-table
            [value]="notifications()"
            [tableStyle]="{ 'min-width': '60rem' }"
            selectionMode="single"
            (onRowSelect)="onRowSelect($event)"
          >
            <ng-template #header>
              <tr>
                <th>ID</th>
                <th>Channel Type</th>
                <th>Delivery Status</th>
                <th>Application ID</th>
                <th>Archived On</th>
              </tr>
            </ng-template>
            <ng-template #body let-n>
              <tr [pSelectableRow]="n" class="cursor-pointer">
                <td>{{ n.id }}</td>
                <td>{{ n.channel_type | channelType }}</td>
                <td>
                  <app-status-badge [status]="n.delivery_status" />
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

    <p-dialog
      header="Archived Notification Details"
      [visible]="detailDialogVisible()"
      (visibleChange)="detailDialogVisible.set($event)"
      [modal]="true"
      [style]="{ width: '700px' }"
    >
      @if (selectedNotification(); as n) {
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="font-semibold text-muted-color block mb-1">ID</span>
              <span>{{ n.id }}</span>
            </div>
            <div>
              <span class="font-semibold text-muted-color block mb-1">Channel Type</span>
              <span>{{ n.channel_type | channelType }}</span>
            </div>
            <div>
              <span class="font-semibold text-muted-color block mb-1">Delivery Status</span>
              <app-status-badge [status]="n.delivery_status" />
            </div>
            <div>
              <span class="font-semibold text-muted-color block mb-1">Application ID</span>
              <span>{{ n.application_id }}</span>
            </div>
            <div>
              <span class="font-semibold text-muted-color block mb-1">Provider ID</span>
              <span>{{ n.provider_id ?? '—' }}</span>
            </div>
            <div>
              <span class="font-semibold text-muted-color block mb-1">Created</span>
              <span>{{ n.created_on | date: 'medium' }}</span>
            </div>
          </div>

          <div>
            <span class="font-semibold text-muted-color block mb-1">Data</span>
            <pre
              class="bg-surface-100 dark:bg-surface-800 p-4 rounded-lg text-sm overflow-auto max-h-64"
              >{{ n.data | json }}</pre
            >
          </div>

          @if (n.result) {
            <div>
              <span class="font-semibold text-muted-color block mb-1">Result</span>
              <pre
                class="bg-surface-100 dark:bg-surface-800 p-4 rounded-lg text-sm overflow-auto max-h-64"
                >{{ n.result | json }}</pre
              >
            </div>
          }
        </div>
      }
    </p-dialog>
  `,
})
export class ArchivedListComponent implements OnInit {
  private readonly service = inject(ArchivedNotificationsService);
  private readonly messageService = inject(MessageService);

  readonly notifications = signal<ArchivedNotification[]>([]);
  readonly loading = signal(true);
  readonly pageInfo = signal<PageInfo | null>(null);
  readonly selectedNotification = signal<ArchivedNotification | null>(null);
  readonly detailDialogVisible = signal(false);
  private currentPage = 1;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);

    this.service.list(this.currentPage, 20).subscribe({
      next: (res) => {
        this.notifications.set(res.items ?? []);
        this.pageInfo.set(res.page_info ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load archived notifications',
        });
        this.loading.set(false);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }

  onRowSelect(event: { data?: ArchivedNotification | ArchivedNotification[] }): void {
    const notification = Array.isArray(event.data) ? event.data[0] : event.data;

    if (!notification) {
      return;
    }

    this.service.getById(notification.id).subscribe({
      next: (notification) => {
        this.selectedNotification.set(notification);
        this.detailDialogVisible.set(true);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load archived notification details',
        });
      },
    });
  }
}

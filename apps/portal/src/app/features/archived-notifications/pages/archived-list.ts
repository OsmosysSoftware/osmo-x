import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { ChannelTypePipe } from '../../../shared/pipes/channel-type.pipe';
import { ArchivedNotificationsService } from '../services/archived-notifications.service';
import { ArchivedNotification, PageInfo } from '../../../core/models/api.model';

@Component({
  selector: 'app-archived-list',
  imports: [
    DatePipe,
    JsonPipe,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    TooltipModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PaginationComponent,
    StatusBadgeComponent,
    ChannelTypePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <p-toolbar class="mb-6">
        <ng-template #start>
          <h2 class="m-0 flex items-center gap-2">
            <i class="pi pi-inbox text-primary"></i>
            Archived Notifications
          </h2>
        </ng-template>
      </p-toolbar>

      @if (loading()) {
        <p-skeleton height="300px" />
      } @else {
        <p-table
          #dt
          [value]="notifications()"
          [globalFilterFields]="['id', 'application_id']"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '60rem' }"
          selectionMode="single"
          (onRowSelect)="onRowSelect($event)"
        >
          <ng-template #caption>
            <div class="flex items-center justify-between">
              <span class="text-muted-color">View completed and archived notifications</span>
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
                  (onClick)="loadNotifications()"
                />
              </div>
            </div>
          </ng-template>
          <ng-template #header>
            <tr>
              <th pSortableColumn="id" style="min-width: 6rem">ID <p-sortIcon field="id" /></th>
              <th>Channel Type</th>
              <th>Delivery Status</th>
              <th pSortableColumn="application_id" style="min-width: 8rem">
                Application ID <p-sortIcon field="application_id" />
              </th>
              <th pSortableColumn="created_on" style="min-width: 10rem">
                Archived On <p-sortIcon field="created_on" />
              </th>
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

  readonly dt = viewChild<Table>('dt');

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

  onGlobalFilter(event: Event): void {
    this.dt()?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
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

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
  templateUrl: './archived-list.html',
  styleUrl: './archived-list.scss',
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

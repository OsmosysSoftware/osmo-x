import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { ChannelTypePipe } from '../../../shared/pipes/channel-type.pipe';
import { JsonViewerDialog } from '../../../shared/components/json-viewer-dialog/json-viewer-dialog';
import { NotificationsService, NotificationFilters } from '../services/notifications.service';
import { ApplicationsService } from '../../applications/services/applications.service';
import { ProvidersService } from '../../providers/services/providers.service';
import { AuthService } from '../../../core/services/auth.service';
import { Notification, Application, Provider, PageInfo } from '../../../core/models/api.model';
import { ChannelType, DeliveryStatus } from '../../../core/constants/notification';

@Component({
  selector: 'app-notifications-list',
  imports: [
    DatePipe,
    JsonPipe,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    DialogModule,
    SelectModule,
    TooltipModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PaginationComponent,
    StatusBadgeComponent,
    ChannelTypePipe,
    JsonViewerDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications-list.html',
  styleUrl: './notifications-list.scss',
})
export class NotificationsListComponent implements OnInit {
  private readonly service = inject(NotificationsService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly providersService = inject(ProvidersService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly clipboard = inject(Clipboard);

  readonly notifications = signal<Notification[]>([]);
  readonly applications = signal<Application[]>([]);
  readonly providers = signal<Provider[]>([]);
  readonly loading = signal(true);
  readonly pageInfo = signal<PageInfo | null>(null);
  readonly selectedNotification = signal<Notification | null>(null);
  readonly detailDialogVisible = signal(false);
  private currentPage = 1;
  private currentLimit = 20;

  // Filter options
  readonly channelTypeOptions = Object.entries(ChannelType).map(([value, label]) => ({
    label,
    value: Number(value),
  }));

  readonly deliveryStatusOptions = Object.entries(DeliveryStatus).map(([value, label]) => ({
    label,
    value: Number(value),
  }));

  readonly applicationOptions = signal<{ label: string; value: number }[]>([]);

  // Filter state
  readonly selectedChannelType = signal<number | null>(null);
  readonly selectedDeliveryStatus = signal<number | null>(null);
  readonly selectedApplicationId = signal<number | null>(null);
  readonly searchText = signal('');

  // JSON viewer dialog
  readonly jsonDialogVisible = signal(false);
  readonly jsonDialogData = signal<Record<string, unknown> | null>(null);
  readonly jsonDialogHeader = signal('JSON Data');

  // Redis cleanup
  readonly isOrgAdmin = computed(() => this.authService.isOrgAdmin());
  readonly cleanupLoading = signal(false);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadNotifications();

    this.applicationsService.list(1, 100).subscribe({
      next: (res) => {
        this.applications.set(res.items ?? []);
        this.applicationOptions.set(
          (res.items ?? []).map((a) => ({ label: a.name, value: a.application_id })),
        );
      },
    });

    this.providersService.list(1, 100).subscribe({
      next: (res) => this.providers.set(res.items ?? []),
    });
  }

  loadNotifications(): void {
    this.loading.set(true);

    const filters: NotificationFilters = {};

    if (this.selectedChannelType()) {
      filters.channel_type = this.selectedChannelType()!;
    }

    if (this.selectedDeliveryStatus()) {
      filters.delivery_status = this.selectedDeliveryStatus()!;
    }

    if (this.selectedApplicationId()) {
      filters.application_id = this.selectedApplicationId()!;
    }

    if (this.searchText().trim()) {
      filters.search = this.searchText().trim();
    }

    this.service.list(this.currentPage, this.currentLimit, filters).subscribe({
      next: (res) => {
        this.notifications.set(res.items ?? []);
        this.pageInfo.set(res.page_info ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load notifications',
        });
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: { page: number; limit: number }): void {
    this.currentPage = event.page;
    this.currentLimit = event.limit;
    this.loadNotifications();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadNotifications();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchText.set(value);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadNotifications();
    }, 400);
  }

  clearFilters(): void {
    this.selectedChannelType.set(null);
    this.selectedDeliveryStatus.set(null);
    this.selectedApplicationId.set(null);
    this.searchText.set('');
    this.currentPage = 1;
    this.loadNotifications();
  }

  getApplicationName(applicationId: number): string {
    const app = this.applications().find((a) => a.application_id === applicationId);

    return app?.name ?? `App #${applicationId}`;
  }

  getProviderName(providerId: number | null): string {
    if (!providerId) {
      return '—';
    }

    const provider = this.providers().find((p) => p.provider_id === providerId);

    return provider?.name ?? `Provider #${providerId}`;
  }

  viewJson(data: Record<string, unknown> | null, header: string): void {
    this.jsonDialogData.set(data);
    this.jsonDialogHeader.set(header);
    this.jsonDialogVisible.set(true);
  }

  copyJson(data: Record<string, unknown> | null): void {
    this.clipboard.copy(JSON.stringify(data, null, 2));
    this.messageService.add({
      severity: 'info',
      summary: 'Copied',
      detail: 'JSON copied to clipboard',
    });
  }

  triggerRedisCleanup(): void {
    this.cleanupLoading.set(true);

    this.service.redisCleanup().subscribe({
      next: () => {
        this.cleanupLoading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Redis cleanup completed',
        });
      },
      error: () => {
        this.cleanupLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Redis cleanup failed',
        });
      },
    });
  }

  onRowSelect(event: { data?: Notification | Notification[] }): void {
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
          detail: 'Failed to load notification details',
        });
      },
    });
  }
}

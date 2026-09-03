import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { DatePipe, JsonPipe } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { FormsModule } from '@angular/forms';
import { TableModule } from '@openng/optimus-ui/table';
import { TagModule } from '@openng/optimus-ui/tag';
import { ButtonModule } from '@openng/optimus-ui/button';
import { SkeletonModule } from '@openng/optimus-ui/skeleton';
import { DialogModule } from '@openng/optimus-ui/dialog';
import { SelectModule } from '@openng/optimus-ui/select';
import { TooltipModule } from '@openng/optimus-ui/tooltip';
import { ToolbarModule } from '@openng/optimus-ui/toolbar';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { DatePickerModule } from '@openng/optimus-ui/datepicker';
import { MessageService } from '@openng/optimus-ui/api';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';
import { ChannelTypePipe } from '../../../../shared/pipes/channel-type.pipe';
import { JsonViewerDialog } from '../../../../shared/components/json-viewer-dialog/json-viewer-dialog';
import { NotificationFiltersComponent } from '../../../../shared/components/notification-filters/notification-filters';
import {
  ArchivedNotificationsService,
  NotificationFilters,
} from '../../../archived-notifications/services/archived-notifications.service';
import { ApplicationsService } from '../../../applications/services/applications.service';
import { ProvidersService } from '../../../providers/services/providers.service';
import {
  ArchivedNotification,
  Application,
  Provider,
  PageInfo,
} from '../../../../core/models/api.model';
import { ChannelType, DeliveryStatus } from '../../../../core/constants/notification';

@Component({
  selector: 'app-filtered-list',
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
    InputTextModule,
    DatePickerModule,
    PaginationComponent,
    StatusBadgeComponent,
    ChannelTypePipe,
    JsonViewerDialog,
    NotificationFiltersComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filtered-list.html',
  styleUrl: './filtered-list.scss',
})
export class FilteredList implements OnInit {
  private readonly service = inject(ArchivedNotificationsService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly providersService = inject(ProvidersService);
  private readonly messageService = inject(MessageService);
  private readonly clipboard = inject(Clipboard);

  readonly notifications = signal<ArchivedNotification[]>([]);
  readonly applications = signal<Application[]>([]);
  readonly providers = signal<Provider[]>([]);
  readonly loading = signal(false);
  readonly pageInfo = signal<PageInfo | null>(null);
  readonly selectedNotification = signal<ArchivedNotification | null>(null);
  readonly detailDialogVisible = signal(false);
  private currentPage = 1;
  private currentLimit = 20;

  readonly channelTypeOptions = Object.entries(ChannelType).map(([value, label]) => ({
    label,
    value: Number(value),
  }));

  readonly deliveryStatusOptions = Object.entries(DeliveryStatus).map(([value, label]) => ({
    label,
    value: Number(value),
  }));

  readonly applicationOptions = signal<{ label: string; value: number }[]>([]);
  readonly allProviderOptions = signal<{ label: string; value: number; applicationId: number }[]>(
    [],
  );
  readonly providerOptions = computed(() => {
    const appId = this.selectedApplicationId();
    const all = this.allProviderOptions();

    return appId ? all.filter((p) => p.applicationId === appId) : all;
  });

  readonly selectedChannelType = signal<number | null>(null);
  readonly selectedDeliveryStatus = signal<number | null>(null);
  readonly selectedApplicationId = signal<number | null>(null);
  readonly selectedProviderId = signal<number | null>(null);
  readonly selectedDateFrom = signal<Date | null>(null);
  readonly selectedDateTo = signal<Date | null>(null);

  readonly propertyFilters = signal<NotificationFilters>({});

  readonly tableSortField = signal('created_on');
  readonly tableSortOrder = signal<number>(-1);
  private currentSort = 'created_on';
  private currentOrder: 'asc' | 'desc' = 'desc';

  readonly jsonDialogVisible = signal(false);
  readonly jsonDialogData = signal<Record<string, unknown> | null>(null);
  readonly jsonDialogHeader = signal('JSON Data');
  private loadSubscription?: Subscription;

  // True when at least one of the mandatory property filters is applied.
  // Toolbar-level filters (channel type, date range, etc.) alone are not sufficient.
  readonly hasPropertyFilter = computed(() => {
    const f = this.propertyFilters();

    return !!(
      f.recipient ||
      f.sender ||
      f.subject ||
      f.message_body ||
      f.template_name ||
      f.advancedFilters?.length
    );
  });

  ngOnInit(): void {
    forkJoin({
      apps: this.applicationsService.listAccessible(),
      providers: this.providersService.list(1, 100),
    }).subscribe({
      next: ({ apps, providers }) => {
        const items = apps ?? [];

        this.applications.set(items);
        this.applicationOptions.set(items.map((a) => ({ label: a.name, value: a.application_id })));

        const providerItems = providers.items ?? [];

        this.providers.set(providerItems);
        this.allProviderOptions.set(
          providerItems.map((p) => ({
            label: p.name,
            value: p.provider_id,
            applicationId: p.application_id,
          })),
        );
      },
      error: () => {
        this.applications.set([]);
        this.applicationOptions.set([]);
        this.providers.set([]);
        this.allProviderOptions.set([]);
      },
    });
  }

  loadNotifications(): void {
    if (!this.hasPropertyFilter()) {
      this.notifications.set([]);
      this.pageInfo.set(null);

      return;
    }

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

    if (this.selectedProviderId()) {
      filters.provider_id = this.selectedProviderId()!;
    }

    if (this.selectedDateFrom()) {
      filters.date_from = this.selectedDateFrom()!.toISOString();
    }

    if (this.selectedDateTo()) {
      filters.date_to = this.selectedDateTo()!.toISOString();
    }

    const property = this.propertyFilters();

    if (property.recipient) filters.recipient = property.recipient;

    if (property.sender) filters.sender = property.sender;

    if (property.subject) filters.subject = property.subject;

    if (property.message_body) filters.message_body = property.message_body;

    if (property.template_name) filters.template_name = property.template_name;

    if (property.advancedFilters?.length) filters.advancedFilters = property.advancedFilters;

    if (this.currentSort) {
      filters.sort = this.currentSort;
      filters.order = this.currentOrder;
    }

    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.service
      .list(this.currentPage, this.currentLimit, filters)
      .subscribe({
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

  onApplicationFilterChange(appId: number | null): void {
    this.selectedApplicationId.set(appId);

    const currentProvider = this.selectedProviderId();

    if (currentProvider && appId) {
      const providerBelongsToApp = this.allProviderOptions().some(
        (p) => p.value === currentProvider && p.applicationId === appId,
      );

      if (!providerBelongsToApp) {
        this.selectedProviderId.set(null);
      }
    }

    this.currentPage = 1;

    if (this.hasPropertyFilter()) {
      this.loadNotifications();
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;

    if (this.hasPropertyFilter()) {
      this.loadNotifications();
    }
  }

  onSort(event: { field: string; order: number }): void {
    const newSort = event.field;
    const newOrder: 'asc' | 'desc' = event.order === 1 ? 'asc' : 'desc';

    if (this.currentSort === newSort && this.currentOrder === newOrder) {
      return;
    }

    this.tableSortField.set(newSort);
    this.tableSortOrder.set(event.order);
    this.currentSort = newSort;
    this.currentOrder = newOrder;
    this.currentPage = 1;
    this.loadNotifications();
  }

  clearFilters(): void {
    this.selectedChannelType.set(null);
    this.selectedDeliveryStatus.set(null);
    this.selectedApplicationId.set(null);
    this.selectedProviderId.set(null);
    this.selectedDateFrom.set(null);
    this.selectedDateTo.set(null);
    this.propertyFilters.set({});
    this.notifications.set([]);
    this.pageInfo.set(null);
    this.currentPage = 1;
  }

  onPropertyFiltersChange(updated: NotificationFilters): void {
    this.propertyFilters.set({
      recipient: updated.recipient,
      sender: updated.sender,
      subject: updated.subject,
      message_body: updated.message_body,
      template_name: updated.template_name,
      advancedFilters: updated.advancedFilters,
    });
    this.currentPage = 1;
    this.loadNotifications();
  }

  onPropertyFiltersClear(): void {
    this.propertyFilters.set({});
    this.notifications.set([]);
    this.pageInfo.set(null);
    this.currentPage = 1;
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

  onRowSelect(event: { data?: ArchivedNotification | ArchivedNotification[] }): void {
    const notification = Array.isArray(event.data) ? event.data[0] : event.data;

    if (!notification) {
      return;
    }

    this.service.getById(notification.id).subscribe({
      next: (n) => {
        this.selectedNotification.set(n);
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

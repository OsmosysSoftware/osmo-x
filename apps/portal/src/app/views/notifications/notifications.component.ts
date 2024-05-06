import { Component, OnInit } from '@angular/core';
import { ChannelType, ChannelTypeMap, DeliveryStatus } from 'src/common/constants/notification';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  filteredNotifications: Notification[] = [];

  allServerApiKeysList = [];

  channelTypeMap = ChannelTypeMap;

  deliveryStatusMap = {
    [DeliveryStatus.PENDING]: { value: 'Pending', style: 'pending' },
    [DeliveryStatus.IN_PROGRESS]: { value: 'In Progress', style: 'in-progress' },
    [DeliveryStatus.SUCCESS]: { value: 'Success', style: 'success' },
    [DeliveryStatus.FAILED]: { value: 'Failed', style: 'failed' },
  };

  channelTypes = Object.entries(ChannelType).map(([, value]) => ({
    label: `${this.channelTypeMap[value].altText} - ${this.channelTypeMap[value].providerName}`,
    value,
  }));

  deliveryStatuses = Object.entries(DeliveryStatus).map(([, value]) => ({
    label: this.deliveryStatusMap[value].value,
    value,
  }));

  applications = null;

  selectedChannelType = null;

  selectedDeliveryStatus = null;

  selectedApplication = null;

  pageSizeOptions: number[] = [5, 10, 25, 50];

  pageSize = 10;

  currentPage = 1;

  totalRecords = 0;

  displayedNotifications: Notification[] = [];

  jsonDialogData: Record<string, unknown>;

  jsonDialogVisible: Boolean = false;

  loading: Boolean = true;

  constructor(
    private notificationService: NotificationsService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.applications = this.getApplications();
    this.selectedApplication = JSON.parse(localStorage.getItem('osmoXUserData'))?.token;
    this.loadNotifications();
  }

  getApplications() {
    this.allServerApiKeysList = [];
    const allKeysFromLocalStorage = JSON.parse(localStorage.getItem('osmoXUserData'))?.allKeys;

    if (!allKeysFromLocalStorage) {
      this.allServerApiKeysList.push(JSON.parse(localStorage.getItem('osmoXUserData'))?.token);
    } else {
      this.allServerApiKeysList = allKeysFromLocalStorage.map((item) => item.apiKey);
    }

    return this.allServerApiKeysList;
  }

  loadNotifications() {
    this.loading = true;
    const variables = { filters: [] };

    if (this.selectedChannelType) {
      variables.filters.push({
        field: 'channelType',
        operator: 'eq',
        value: this.selectedChannelType.toString(),
      });
    }

    if (this.selectedDeliveryStatus) {
      variables.filters.push({
        field: 'deliveryStatus',
        operator: 'eq',
        value: this.selectedDeliveryStatus.toString(),
      });
    }

    // Fetch notifications and handle errors
    this.notificationService
      .getNotifications(variables, this.selectedApplication)
      .pipe(
        // catchError operator to handle errors
        catchError((error) => {
          this.messageService.add({
            key: 'tst',
            severity: 'error',
            summary: 'Error',
            detail: `There was an error while loading notifications. Reason: ${error.message}`,
          });
          return of([]);
        }),
      )
      .subscribe((notifications: Notification[]) => {
        this.notifications = [];
        this.notifications.push(...notifications);
        // Apply filters to the merged array of notifications
        this.applyFilters();
        this.loading = false;
      });
  }

  applyFilters() {
    this.filteredNotifications = this.notifications;
    this.totalRecords = this.notifications.length;
    this.updateDisplayedNotifications();
  }

  // Update displayed notifications based on pagination
  updateDisplayedNotifications() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedNotifications = this.filteredNotifications.slice(startIndex, endIndex);
  }

  // Handle page change event
  onPageChange(event) {
    this.currentPage = event.page;
    this.updateDisplayedNotifications();
  }

  // Handle page size change event
  onPageSizeChange() {
    this.updateDisplayedNotifications();
  }

  showJsonObject(json: Record<string, unknown>): void {
    this.jsonDialogData = json;
    this.jsonDialogVisible = true;
  }

  closeJsonDialog(): void {
    this.jsonDialogVisible = false;
    this.jsonDialogData = null;
  }
}

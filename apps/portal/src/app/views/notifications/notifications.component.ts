import { Component, OnInit } from '@angular/core';
import { ChannelType, ChannelTypeMap, DeliveryStatus } from 'src/common/constants/notification';
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

  channelTypes = Object.entries(ChannelType).map(([key, value]) => ({ label: key, value }));

  deliveryStatuses = Object.entries(DeliveryStatus).map(([key, value]) => ({
    label: key,
    value,
  }));

  selectedChannelType = null;

  selectedDeliveryStatus = null;

  pageSizeOptions: number[] = [5, 10, 25, 50];

  pageSize = 10;

  currentPage = 1;

  totalRecords = 0;

  displayedNotifications: Notification[] = [];

  jsonDialogData: Record<string, unknown>;

  jsonDialogVisible: Boolean = false;

  loading: Boolean = true;

  deliveryStatusMap = {
    [DeliveryStatus.PENDING]: { value: 'Pending', style: 'pending' },
    [DeliveryStatus.IN_PROGRESS]: { value: 'In Progress', style: 'in-progress' },
    [DeliveryStatus.SUCCESS]: { value: 'Success', style: 'success' },
    [DeliveryStatus.FAILED]: { value: 'Failed', style: 'failed' },
  };

  channelTypeMap = ChannelTypeMap;

  constructor(private notificationService: NotificationsService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading = true;
    this.notificationService.getNotifications().subscribe(
      (notifications: Notification[]) => {
        this.notifications = notifications;
        this.applyFilters();
        this.loading = false;
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('Error loading notifications:', error);
        this.loading = false;
      },
    );
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

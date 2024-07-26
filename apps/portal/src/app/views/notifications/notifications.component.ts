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

  allApplicationsList = [];

  allPortalChannelTypes = ChannelType;

  channelTypeMap = ChannelTypeMap;

  deliveryStatusMap = {
    [DeliveryStatus.PENDING]: { value: 'Pending', style: 'pending' },
    [DeliveryStatus.IN_PROGRESS]: { value: 'In Progress', style: 'in-progress' },
    [DeliveryStatus.AWAITING_CONFIRMATION]: {
      value: 'Awaiting Confirmation',
      style: 'awaiting-confirmation',
    },
    [DeliveryStatus.QUEUED_CONFIRMATION]: {
      value: 'Queued Confirmation',
      style: 'queued-confirmation',
    },
    [DeliveryStatus.SUCCESS]: { value: 'Success', style: 'success' },
    [DeliveryStatus.FAILED]: { value: 'Failed', style: 'failed' },
  };

  // for component
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

  mapApplicationAndKeys = null;

  pageSizeOptions: number[] = [5, 10, 25, 50];

  pageSize = 10;

  currentPage = 1;

  totalRecords = 0;

  totalRecordsForCurrentApplication = -1;

  fixedChunkSize = 100;

  currentOffset = 0;

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
    this.selectedApplication = this.setApplicationOnInit();
    this.handleApplicationChange();
  }

  getApplications() {
    this.allServerApiKeysList = [];
    const allKeysFromLocalStorage = JSON.parse(localStorage.getItem('osmoXUserData'))?.allKeys;

    if (!allKeysFromLocalStorage) {
      this.allServerApiKeysList.push(JSON.parse(localStorage.getItem('osmoXUserData'))?.token);
      return JSON.parse(localStorage.getItem('osmoXUserData'))?.token;
    }

    this.allServerApiKeysList = allKeysFromLocalStorage.map((item) => item.apiKey);

    this.mapApplicationAndKeys = new Map<string, string>();

    allKeysFromLocalStorage.forEach((application) => {
      this.allApplicationsList.push(application.applicationDetails.name);
      this.mapApplicationAndKeys.set(application.applicationDetails.name, application.apiKey);
    });

    return this.allApplicationsList;
  }

  setApplicationOnInit() {
    if (this.allApplicationsList.length === 0) {
      return JSON.parse(localStorage.getItem('osmoXUserData'))?.token;
    }

    return this.allApplicationsList[0];
  }

  setTokenForSelectedApplication() {
    if (this.allApplicationsList.length === 0) {
      return JSON.parse(localStorage.getItem('osmoXUserData'))?.token;
    }

    return this.mapApplicationAndKeys.get(this.selectedApplication);
  }

  loadNotifications() {
    this.loading = true;
    const setCurrentLimit = this.fixedChunkSize + this.currentOffset;
    console.log(`currentLimit = ${setCurrentLimit}`);
    const variables = { limit: setCurrentLimit, offset: 0, filters: [] };

    if (this.selectedChannelType) {
      if (this.selectedChannelType === this.allPortalChannelTypes.UNKNOWN) {
        // Condition to filter all notifications with unknown channel type
        const existingChannelTypes = Object.keys(ChannelTypeMap).filter(
          (value) => value !== this.allPortalChannelTypes.UNKNOWN.toString(),
        );
        existingChannelTypes.forEach((key) => {
          variables.filters.push({
            field: 'channelType',
            operator: 'ne',
            value: key.toString(),
          });
        });
      } else {
        // Default behavior
        variables.filters.push({
          field: 'channelType',
          operator: 'eq',
          value: this.selectedChannelType.toString(),
        });
      }
    }

    if (this.selectedDeliveryStatus) {
      variables.filters.push({
        field: 'deliveryStatus',
        operator: 'eq',
        value: this.selectedDeliveryStatus.toString(),
      });
    }

    // set the token based on selected application
    const tokenForSelectedApplication = this.setTokenForSelectedApplication();

    // Fetch notifications and handle errors
    this.notificationService
      .getNotifications(variables, tokenForSelectedApplication)
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

  // Get the total number of records for current application
  getTotalRecordsForCurrentApplication() {
    const totalRecordvariables = { limit: 1, offset: 0 };

    // set the token based on selected application
    const tokenForSelectedApplication = this.setTokenForSelectedApplication();

    // Fetch number of total records for current application and handle errors
    this.notificationService
      .getTotalRecords(totalRecordvariables, tokenForSelectedApplication)
      .pipe(
        // catchError operator to handle errors
        catchError((error) => {
          this.messageService.add({
            key: 'tst',
            severity: 'error',
            summary: 'Error',
            detail: `There was an error while fetching total number of records. Reason: ${error.message}`,
          });
          return of([]);
        }),
      )
      .subscribe((totalResponse: number) => {
        this.totalRecordsForCurrentApplication = -1;
        this.totalRecordsForCurrentApplication = totalResponse;
      });
  }

  // Logic to append notifications
  appendNotifications() {
    this.loading = true;
    const variables = { limit: this.fixedChunkSize, offset: this.currentOffset, filters: [] };

    // set the token based on selected application
    const tokenForSelectedApplication = this.setTokenForSelectedApplication();

    // Fetch notifications and handle errors
    this.notificationService
      .getNotifications(variables, tokenForSelectedApplication)
      .pipe(
        // catchError operator to handle errors
        catchError((error) => {
          this.messageService.add({
            key: 'tst',
            severity: 'error',
            summary: 'Error',
            detail: `There was an error while appending notifications. Reason: ${error.message}`,
          });
          return of([]);
        }),
      )
      .subscribe((appendedNotifications: Notification[]) => {
        this.notifications.push(...appendedNotifications);
        // Apply filters to the merged array of notifications
        this.applyFilters();
        this.loading = false;
      });
  }

  // Handle page change event
  onPageChange(event) {
    this.currentPage = event.page;
    console.log(event);

    // Logic to append values when user goes to last tab
    const currentPageTab = parseInt(event.first, 10) + parseInt(event.rows, 10);

    if (
      currentPageTab % this.fixedChunkSize === 0 && // selected page is multiple of chunksize
      this.totalRecords > this.currentOffset &&
      this.totalRecords === currentPageTab &&
      this.totalRecords !== 0
    ) {
      if (this.totalRecords < this.totalRecordsForCurrentApplication) {
        this.currentOffset += this.fixedChunkSize;
        console.log(
          `total records = ${this.totalRecords} current app total = ${this.totalRecordsForCurrentApplication}`,
        );
        console.log(`current offset = ${this.currentOffset}`);
        this.appendNotifications();
      }
    } else {
      this.updateDisplayedNotifications();
    }
  }

  handleApplicationChange() {
    this.totalRecords = 0;
    this.totalRecordsForCurrentApplication = -1;
    this.notifications = [];
    this.currentOffset = 0;
    this.getTotalRecordsForCurrentApplication();
    this.loadNotifications();
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

import { Component, OnInit } from '@angular/core';
import { ChannelType, ChannelTypeMap, DeliveryStatus } from 'src/common/constants/notification';
import { LazyLoadEvent, MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationResponse } from './notification.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];

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

  selectedFromDate = null;

  selectedToDate = null;

  mapApplicationAndKeys = null;

  pageSizeOptions: number[] = [5, 10, 25, 50];

  pageSize = 10;

  currentPage = 1;

  totalRecords = 0;

  jsonDialogData: Record<string, unknown>;

  jsonDialogVisible: Boolean = false;

  loading: Boolean = true;

  maxDateFrom = new Date();

  maxDateTo = new Date();

  minDateTo = null;

  constructor(
    private notificationService: NotificationsService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.applications = this.getApplications();
    this.selectedApplication = this.setApplicationOnInit();
    this.loadNotificationsLazy({ first: 0, rows: this.pageSize });
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

  onToDateChange() {
    this.maxDateFrom = this.selectedToDate;
  }

  onFromDateChange() {
    this.minDateTo = new Date(
      new Date(this.selectedFromDate).setDate(this.selectedFromDate.getDate() + 1),
    );
  }

  onFromDateClear() {
    this.minDateTo = null;
  }

  onToDateClear() {
    this.maxDateFrom = new Date();
  }

  setTokenForSelectedApplication() {
    if (this.allApplicationsList.length === 0) {
      return JSON.parse(localStorage.getItem('osmoXUserData'))?.token;
    }

    return this.mapApplicationAndKeys.get(this.selectedApplication);
  }

  loadNotificationsLazy(event: LazyLoadEvent) {
    this.loading = true;
    // event.first indicates how many records should be skipped from the beginning of the dataset
    // event.rows represents the number of records to be displayed on the current page
    const variables = {
      filters: [],
      offset: event.first,
      limit: event.rows,
    };

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
        // Default behavior when we are sorting on known channelType
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

    if (this.selectedFromDate) {
      variables.filters.push({
        field: 'createdOn',
        operator: 'gt',
        value: this.selectedFromDate.toString(),
      });
    }

    if (this.selectedToDate) {
      variables.filters.push({
        field: 'createdOn',
        operator: 'lt',
        value: this.selectedToDate.toString(),
      });
    }

    console.log(variables);

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
      .subscribe((notificationResponse: NotificationResponse) => {
        // pagination is handled by p-table component of primeng
        this.notifications = notificationResponse.notifications;
        this.totalRecords = notificationResponse.total;
        this.loading = false;
      });
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

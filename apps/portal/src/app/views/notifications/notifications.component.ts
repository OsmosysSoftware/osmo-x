import { Component, OnInit } from '@angular/core';
import { ChannelType, ChannelTypeMap, DeliveryStatus } from 'src/common/constants/notification';
import { LazyLoadEvent, MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationResponse } from './notification.model';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationResponse } from '../applications/application.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];

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

  applications = [];

  selectedChannelType = null;

  selectedDeliveryStatus = null;

  selectedApplication = null;

  selectedFromDate = null;

  selectedToDate = null;

  searchValue = null;

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
    private applicationService: ApplicationsService,
    private messageService: MessageService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.getApplications();
  }

  getApplications() {
    // Set the query variables
    const variables = {
      filters: [],
      offset: 0,
      limit: 10,
    };

    // Fetch the login token
    const loginToken = this.getJWTLoginToken();

    if (!loginToken) {
      // Handle missing token
      return;
    }

    // Fetch applications and handle errors
    this.applicationService
      .getApplications(variables, loginToken)
      .pipe(
        // catchError operator to handle errors
        catchError((error) => {
          this.messageService.add({
            key: 'tst',
            severity: 'error',
            summary: 'Error',
            detail: `There was an error while loading applications. Reason: ${error.message}`,
          });
          return of(null); // Return null to indicate error
        }),
      )
      .subscribe((applicationResponse: ApplicationResponse | null) => {
        if (applicationResponse.errors) {
          const unauthorizedError = applicationResponse.errors.find(
            (error) => error.message === 'Unauthorized',
          );

          this.applications = [];
          this.selectedApplication = null;

          if (unauthorizedError) {
            this.messageService.add({
              key: 'tst',
              severity: 'error',
              summary: 'Error',
              detail: 'Unauthorized access. Please log in again.',
            });
            this.authService.logoutUser();
          } else {
            applicationResponse.errors.forEach((error) => {
              this.messageService.add({
                key: 'tst',
                severity: 'error',
                summary: 'Error',
                detail: `GraphQL Error - Get Applications: ${error.message}`,
              });
            });
          }
        } else if (applicationResponse && applicationResponse.applications) {
          // Fetch list of applications for dropdown
          this.applications = applicationResponse.applications.map((obj) => ({
            // Name to display and ID to return upon selection
            label: obj.name,
            value: obj.applicationId,
          }));

          if (this.applications.length > 0) {
            this.selectedApplication = this.applications[0].value;
          } else {
            this.selectedApplication = null;
          }
        } else {
          this.applications = [];
          this.selectedApplication = null;
        }

        // Now that applications are loaded, load notifications
        this.loadNotificationsLazy({ first: 0, rows: this.pageSize });
      });
  }

  onToDateChange() {
    this.maxDateFrom = this.selectedToDate;
  }

  onFromDateChange() {
    this.minDateTo = this.selectedFromDate;
  }

  onFromDateClear() {
    this.minDateTo = null;
  }

  onToDateClear() {
    this.maxDateFrom = new Date();
  }

  onSearchClear() {
    this.searchValue = null;
  }

  getJWTLoginToken() {
    try {
      const userData = localStorage.getItem('osmoXUserData');

      if (userData) {
        const userToken = JSON.parse(userData).token;
        return userToken;
      }

      throw new Error('User data not found in localStorage');
    } catch (error) {
      this.messageService.add({
        key: 'tst',
        severity: 'error',
        summary: 'Error',
        detail: `There was an error fetching the login token: ${error.message}`,
      });
      return null;
    }
  }

  loadNotificationsLazy(event: LazyLoadEvent) {
    this.loading = true;

    // Fetch the login token
    const loginToken = this.getJWTLoginToken();

    if (!loginToken) {
      this.loading = false;
      return;
    }

    // event.first indicates how many records should be skipped from the beginning of the dataset
    // event.rows represents the number of records to be displayed on the current page
    const variables = {
      filters: [],
      offset: event.first,
      limit: event.rows,
    };

    // Exit if no application selected
    if (!this.selectedApplication) {
      this.loading = false;
      return;
    }

    // Set query filters
    variables.filters.push({
      field: 'applicationId',
      operator: 'eq',
      value: this.selectedApplication.toString(),
    });

    if (this.selectedChannelType) {
      if (this.selectedChannelType === this.allPortalChannelTypes.UNKNOWN) {
        // Condition to filter all notifications with unknown channel type
        const existingChannelTypes = Object.keys(this.channelTypeMap).filter(
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
        value: new Date(
          new Date(this.selectedFromDate).setTime(this.selectedFromDate.getTime() - 1000),
        ).toString(),
      });
    }

    if (this.selectedToDate) {
      variables.filters.push({
        field: 'createdOn',
        operator: 'lt',
        value: new Date(
          new Date(this.selectedToDate).setDate(this.selectedToDate.getDate() + 1),
        ).toISOString(),
      });
    }

    if (this.searchValue) {
      variables.filters.push({
        field: 'data',
        operator: 'contains',
        value: this.searchValue,
      });
    }

    // Fetch notifications and handle errors
    this.notificationService
      .getNotifications(variables, loginToken)
      .pipe(
        // catchError operator to handle errors
        catchError((error) => {
          this.messageService.add({
            key: 'tst',
            severity: 'error',
            summary: 'Error',
            detail: `There was an error while loading notifications. Reason: ${error.message}`,
          });
          this.loading = false;
          return of(null);
        }),
      )
      .subscribe((notificationResponse: NotificationResponse | null) => {
        if (notificationResponse && notificationResponse.notifications) {
          // pagination is handled by p-table component of primeng
          this.notifications = notificationResponse.notifications;
          this.totalRecords = notificationResponse.total;
        } else {
          this.notifications = [];
          this.totalRecords = 0;
        }

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

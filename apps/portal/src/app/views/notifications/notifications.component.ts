import { Component, OnInit } from '@angular/core';
import { ChannelType, ChannelTypeMap, DeliveryStatus } from 'src/common/constants/notification';
import { LazyLoadEvent, MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationResponse } from './notification.model';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationResponse } from '../applications/application.model';
import { ProvidersService } from '../providers/providers.service';
import { ProviderAndNotificationResponse } from '../providers/provider.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: false,
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
  deliveryStatuses = Object.entries(DeliveryStatus).map(([, value]) => ({
    label: this.deliveryStatusMap[value].value,
    value,
  }));

  applications = [];

  providers = [];

  selectedDeliveryStatus = null;

  selectedApplication = null;

  selectedProvider = null;

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

  archivedNotificationToggle = false;

  constructor(
    private notificationService: NotificationsService,
    private applicationService: ApplicationsService,
    private providerService: ProvidersService,
    private messageService: MessageService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.getApplicationsAndInitializeData();
  }

  toggleArchive() {
    this.archivedNotificationToggle = !this.archivedNotificationToggle;
    // Now that toggle has been activated, load notifications
    this.loadNotificationsLazy({ first: 0, rows: this.pageSize });
  }

  getApplicationsAndInitializeData() {
    // Set the query variables
    const variables = {
      filters: [],
      offset: 0,
      limit: 20,
    };

    // Fetch the login token
    const loginToken = this.getJWTLoginToken();

    if (!loginToken) {
      this.authService.logoutUser();
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
        if (applicationResponse?.errors?.length) {
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
        } else if (applicationResponse?.applications?.length) {
          // Fetch list of applications for select
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

        // Now that applications are loaded, load providers and notifications
        this.loadProvidersAndNotificationsForSelectedApplication({ first: 0, rows: this.pageSize });
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

  getOffset(): number {
    return Math.max(0, (this.currentPage - 1) * this.pageSize);
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

  loadProvidersAndNotificationsForSelectedApplication(event: LazyLoadEvent) {
    this.loading = true;
    this.selectedProvider = null;

    // Set the query variables
    const variables = {
      providerFilters: [],
      providerOffset: 0,
      providerLimit: 20,
      notificationFilters: [],
      notificationOffset: event.first,
      notificationLimit: event.rows,
    };

    if (!this.selectedApplication) {
      // Handle missing selected application
      this.messageService.add({
        key: 'tst',
        severity: 'error',
        summary: 'Error',
        detail: 'Application is missing for loading providers',
      });
      this.loading = false;
      return;
    }

    // Set query filters
    const applicationIdFilterObject = {
      field: 'applicationId',
      operator: 'eq',
      value: this.selectedApplication.toString(),
    };

    variables.providerFilters.push(applicationIdFilterObject);
    variables.notificationFilters.push(applicationIdFilterObject);

    // Add rest of the filters
    const combinedNotificationFilters = this.getCombinedNotificationFilters();
    variables.notificationFilters.push(...combinedNotificationFilters);

    // Fetch the login token
    const loginToken = this.getJWTLoginToken();

    if (!loginToken) {
      this.authService.logoutUser();
      return;
    }

    // Set page size
    this.pageSize = event.rows;

    // Set current page
    this.currentPage = Math.floor(event.first / event.rows) + 1;

    // Fetch providers & notifications together. Handle errors
    this.providerService
      .getProvidersAndNotifications(variables, loginToken, this.archivedNotificationToggle)
      .pipe(
        // catchError operator to handle errors
        catchError((error) => {
          this.messageService.add({
            key: 'tst',
            severity: 'error',
            summary: 'Error',
            detail: `Error while loading providers and notifications: ${error.message}`,
          });
          return of(null); // Return null to indicate error
        }),
      )
      .subscribe((providerAndNotificationResponse: ProviderAndNotificationResponse | null) => {
        if (providerAndNotificationResponse?.errors?.length) {
          const unauthorizedError = providerAndNotificationResponse.errors.find(
            (error) => error.message === 'Unauthorized',
          );

          this.providers = [];

          if (unauthorizedError) {
            this.messageService.add({
              key: 'tst',
              severity: 'error',
              summary: 'Error',
              detail: 'Unauthorized access. Please log in again.',
            });
            this.authService.logoutUser();
          } else {
            providerAndNotificationResponse.errors.forEach((error) => {
              this.messageService.add({
                key: 'tst',
                severity: 'error',
                summary: 'Error',
                detail: `GraphQL Error - Get Providers and Notifications: ${error.message}`,
              });
            });
          }
        } else if (providerAndNotificationResponse?.providers?.length) {
          // Fetch list of providers for select
          this.providers = providerAndNotificationResponse.providers.map((obj) => ({
            // Name to display and ID to return upon selection
            label: this.channelTypeMap[obj.channelType]?.altText
              ? `${obj.name} - ${this.channelTypeMap[obj.channelType].altText}`
              : `${obj.name} - ${this.channelTypeMap[ChannelType.UNKNOWN].altText}`,
            value: obj.providerId,
          }));

          // Set notifications
          if (providerAndNotificationResponse?.notifications?.length) {
            this.notifications = providerAndNotificationResponse.notifications;
            this.totalRecords = providerAndNotificationResponse.notificationTotal;
          } else {
            this.notifications = [];
            this.totalRecords = 0;
          }
        } else {
          this.providers = [];
          this.selectedProvider = null;
          this.notifications = [];
          this.totalRecords = 0;
        }

        this.loading = false;
      });
  }

  loadNotificationsLazy(event: LazyLoadEvent) {
    this.loading = true;

    // Fetch the login token
    const loginToken = this.getJWTLoginToken();

    if (!loginToken) {
      this.loading = false;
      this.authService.logoutUser();
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

    // Add rest of the filters
    const combinedNotificationFilters = this.getCombinedNotificationFilters();
    variables.filters.push(...combinedNotificationFilters);

    // Set page size
    this.pageSize = event.rows;

    // Set current page
    this.currentPage = Math.floor(event.first / event.rows) + 1;

    // Check if we need to fetch from archive table or notifications table
    if (this.archivedNotificationToggle) {
      // Fetch archived notifications and handle errors
      this.notificationService
        .getArchivedNotifications(variables, loginToken)
        .pipe(
          // catchError operator to handle errors
          catchError((error) => {
            this.messageService.add({
              key: 'tst',
              severity: 'error',
              summary: 'Error',
              detail: `There was an error while loading archived notifications. Reason: ${error.message}`,
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
    } else {
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
  }

  getCombinedNotificationFilters() {
    const combinedNotificationFilters = [];

    if (this.selectedDeliveryStatus) {
      combinedNotificationFilters.push({
        field: 'deliveryStatus',
        operator: 'eq',
        value: this.selectedDeliveryStatus.toString(),
      });
    }

    if (this.selectedProvider) {
      combinedNotificationFilters.push({
        field: 'providerId',
        operator: 'eq',
        value: this.selectedProvider.toString(),
      });
    }

    if (this.selectedFromDate) {
      combinedNotificationFilters.push({
        field: 'createdOn',
        operator: 'gt',
        value: new Date(
          new Date(this.selectedFromDate).setDate(this.selectedFromDate.getDate()),
        ).toISOString(),
      });
    }

    if (this.selectedToDate) {
      combinedNotificationFilters.push({
        field: 'createdOn',
        operator: 'lt',
        value: new Date(
          new Date(this.selectedToDate).setDate(this.selectedToDate.getDate() + 1),
        ).toISOString(),
      });
    }

    if (this.searchValue) {
      combinedNotificationFilters.push({
        field: 'data',
        operator: 'contains',
        value: this.searchValue,
      });
    }

    return combinedNotificationFilters;
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

import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { GraphqlService } from 'src/app/graphql/graphql.service';
import { GetArchivedNotifications, GetNotifications } from 'src/app/graphql/graphql.queries';
import { ApolloQueryResult } from '@apollo/client/core';
import { ArchivedNotification, Notification, NotificationResponse } from './notification.model';

interface GetNotificationsResponse {
  notifications: {
    notifications?: Notification[];
    total?: number;
    offset?: number;
    limit?: number;
  };
}

interface GetArchivedNotificationsResponse {
  archivedNotifications: {
    archivedNotifications?: ArchivedNotification[];
    total?: number;
    offset?: number;
    limit?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  constructor(private graphqlService: GraphqlService) {}

  getNotifications(variables: unknown, inputToken: string): Observable<NotificationResponse> {
    return this.graphqlService.query(GetNotifications, variables, inputToken).pipe(
      map((response: ApolloQueryResult<GetNotificationsResponse>) => {
        const notificationArray = response.data?.notifications.notifications;

        const notificationResponseObject: NotificationResponse = {
          notifications: [...notificationArray],
          total: response.data?.notifications.total,
          offset: response.data?.notifications.offset,
          limit: response.data?.notifications.limit,
        };
        return notificationResponseObject;
      }),
      catchError((error) => {
        const errorMessage: string = error.message;
        throw new Error(errorMessage);
      }),
    );
  }

  getArchivedNotifications(variables, inputToken): Observable<NotificationResponse> {
    return this.graphqlService.query(GetArchivedNotifications, variables, inputToken).pipe(
      map((response: ApolloQueryResult<GetArchivedNotificationsResponse>) => {
        const archivedNotificationArray =
          response.data?.archivedNotifications.archivedNotifications;

        const notificationResponseObject: NotificationResponse = {
          notifications:
            archivedNotificationArray?.map((item) => ({
              id: item.notificationId,
              channelType: item.channelType,
              data: item.data,
              deliveryStatus: item.deliveryStatus,
              result: item.result,
              createdOn: item.createdOn,
              updatedOn: item.updatedOn,
              createdBy: item.createdBy,
              updatedBy: item.updatedBy,
              status: item.status,
            })) ?? [],
          total: response.data?.archivedNotifications.total,
          offset: response.data?.archivedNotifications.offset,
          limit: response.data?.archivedNotifications.limit,
        };
        return notificationResponseObject;
      }),
      catchError((error) => {
        const errorMessage: string = error.message;
        throw new Error(errorMessage);
      }),
    );
  }
}

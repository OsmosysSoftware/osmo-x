import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { GraphqlService } from 'src/app/graphql/graphql.service';
import { GetNotifications } from 'src/app/graphql/graphql.queries';
import { ApolloQueryResult } from '@apollo/client/core';
import { Notification, NotificationResponse } from './notification.model';

interface GetNotificationsResponse {
  notifications: {
    notifications?: Notification[];
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

  getNotifications(variables, inputToken): Observable<NotificationResponse> {
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
}

import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphqlService } from 'src/app/graphql/graphql.service';
import { GetNotifications } from 'src/app/graphql/graphql.queries';
import { ApolloQueryResult } from '@apollo/client/core';
import { Notification } from './notification.model';

interface GetNotificationsResponse {
  notifications: {
    notifications?: Notification[];
  };
}
@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  constructor(private graphqlService: GraphqlService) {}

  getNotifications(variables, inputToken): Observable<Notification[]> {
    return this.graphqlService.query(GetNotifications, variables, inputToken).pipe(
      map((response: ApolloQueryResult<GetNotificationsResponse>) => {
        if (response.error) {
          const errorMessage: string = response.error.message;
          throw new Error(errorMessage);
        } else {
          const notifications = response.data?.notifications.notifications;
          return [...notifications];
        }
      }),
    );
  }
}

import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { GraphqlService } from 'src/app/graphql/graphql.service';
import { GetNotifications, GetTotalNumberOfRecords } from 'src/app/graphql/graphql.queries';
import { ApolloQueryResult } from '@apollo/client/core';
import { Notification } from './notification.model';

interface GetNotificationsResponse {
  notifications: {
    notifications?: Notification[];
    total?: number;
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
        const notifications = response.data?.notifications.notifications;
        return [...notifications];
      }),
      catchError((error) => {
        const errorMessage: string = error.message;
        throw new Error(errorMessage);
      }),
    );
  }

  getTotalRecords(variables, inputToken): Observable<number> {
    return this.graphqlService.query(GetTotalNumberOfRecords, variables, inputToken).pipe(
      map((response: ApolloQueryResult<GetNotificationsResponse>) => {
        const totalRecords = response.data?.notifications.total;
        return totalRecords;
      }),
      catchError((error) => {
        const errorMessage: string = error.message;
        throw new Error(errorMessage);
      }),
    );
  }
}

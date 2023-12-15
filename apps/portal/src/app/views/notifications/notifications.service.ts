import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GraphqlService } from 'src/app/graphql/graphql.service';
import { GetNotifcations } from 'src/app/graphql/graphql.queries';
import { ApolloQueryResult } from '@apollo/client/core';
import { Notification } from './notification.model';

interface GetNoticationsResponse {
  notifications?: Notification[];
}
@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  constructor(private graphqlService: GraphqlService) {}

  getNotifications(): Observable<Notification[]> {
    return this.graphqlService.query(GetNotifcations).pipe(
      map((response: ApolloQueryResult<GetNoticationsResponse>) => {
        if (response.error) {
          const errorMessage: string = response.error.message;
          throw new Error(errorMessage);
        } else {
          const notifcations = response.data?.notifications;
          return JSON.parse(JSON.stringify(notifcations));
        }
      }),
    );
  }
}

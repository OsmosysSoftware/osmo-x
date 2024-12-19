import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { GraphqlService } from 'src/app/graphql/graphql.service';
import { ApolloQueryResult } from '@apollo/client/core';
import {
  GetProvidersAndArchivedNotifications,
  GetProvidersAndNotifications,
} from 'src/app/graphql/graphql.queries';
import { Provider, ProviderAndNotificationResponse } from './provider.model';
import { ArchivedNotification, Notification } from '../notifications/notification.model';

interface GetProviderNotificationResponse {
  providers: {
    providers?: Provider[];
    total?: number;
    offset?: number;
    limit?: number;
  };
  notifications: {
    notifications?: Notification[];
    total?: number;
    offset?: number;
    limit?: number;
  };
}

interface GetProviderArchivedNotificationResponse {
  providers: {
    providers?: Provider[];
    total?: number;
    offset?: number;
    limit?: number;
  };
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
export class ProvidersService {
  constructor(private graphqlService: GraphqlService) {}

  getProvidersAndNotifications(
    variables,
    inputToken,
    archivedNotificationToggle,
  ): Observable<ProviderAndNotificationResponse> {
    if (archivedNotificationToggle) {
      return this.graphqlService
        .query(GetProvidersAndArchivedNotifications, variables, inputToken)
        .pipe(
          map((response: ApolloQueryResult<GetProviderArchivedNotificationResponse>) => {
            const providerArray = response.data?.providers.providers;
            const archivedNotificationArray =
              response.data?.archivedNotifications.archivedNotifications;

            const convertToNotificationArray =
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
              })) ?? [];

            const providerArchivedResponseObject: ProviderAndNotificationResponse = {
              providers: providerArray,
              providerTotal: response.data?.providers.total,
              providerOffset: response.data?.providers.offset,
              providerLimit: response.data?.providers.limit,
              notifications: convertToNotificationArray,
              notificationTotal: response.data?.archivedNotifications.total,
              notificationOffset: response.data?.archivedNotifications.offset,
              notificationLimit: response.data?.archivedNotifications.limit,
              errors: response.errors || null,
            };
            return providerArchivedResponseObject;
          }),
          catchError((error) => {
            const errorMessage: string = error.message;
            throw new Error(errorMessage);
          }),
        );
    }

    return this.graphqlService.query(GetProvidersAndNotifications, variables, inputToken).pipe(
      map((response: ApolloQueryResult<GetProviderNotificationResponse>) => {
        const providerArray = response.data?.providers.providers;
        const notificationArray = response.data?.notifications.notifications;

        const providerNotificationResponseObject: ProviderAndNotificationResponse = {
          providers: providerArray,
          providerTotal: response.data?.providers.total,
          providerOffset: response.data?.providers.offset,
          providerLimit: response.data?.providers.limit,
          notifications: notificationArray,
          notificationTotal: response.data?.notifications.total,
          notificationOffset: response.data?.notifications.offset,
          notificationLimit: response.data?.notifications.limit,
          errors: response.errors || null,
        };
        return providerNotificationResponseObject;
      }),
      catchError((error) => {
        const errorMessage: string = error.message;
        throw new Error(errorMessage);
      }),
    );
  }
}

import { GraphQLFormattedError } from 'graphql/error/GraphQLError';
import { Notification } from '../notifications/notification.model';

export interface Provider {
  providerId: number;
  name: string;
  channelType: number;
  createdOn: Date;
  updatedOn: Date;
  status: number;
}

export interface ProviderAndNotificationResponse {
  providers: Provider[];
  providerTotal: number;
  providerOffset: number;
  providerLimit: number;
  notifications: Notification[];
  notificationTotal: number;
  notificationOffset: number;
  notificationLimit: number;
  errors?: ReadonlyArray<GraphQLFormattedError>;
}

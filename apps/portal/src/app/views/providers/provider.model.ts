import { GraphQLFormattedError } from 'graphql/error/GraphQLError';

export interface Provider {
  providerId: number;
  name: string;
  channelType: number;
  createdOn: Date;
  updatedOn: Date;
  status: number;
}

export interface ProviderResponse {
  providers: Provider[];
  total: number;
  offset: number;
  limit: number;
  errors?: ReadonlyArray<GraphQLFormattedError>;
}

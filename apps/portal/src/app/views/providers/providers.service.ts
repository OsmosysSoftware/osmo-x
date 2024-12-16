import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { GraphqlService } from 'src/app/graphql/graphql.service';
import { GetProviders } from 'src/app/graphql/graphql.queries';
import { ApolloQueryResult } from '@apollo/client/core';
import { Provider, ProviderResponse } from './provider.model';

interface GetProvidersResponse {
  providers: {
    providers?: Provider[];
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

  getProviders(variables, inputToken): Observable<ProviderResponse> {
    return this.graphqlService.query(GetProviders, variables, inputToken).pipe(
      map((response: ApolloQueryResult<GetProvidersResponse>) => {
        const providerArray = response.data?.providers.providers;

        const providerResponseObject: ProviderResponse = {
          providers: providerArray,
          total: response.data?.providers.total,
          offset: response.data?.providers.offset,
          limit: response.data?.providers.limit,
          errors: response.errors || null,
        };
        return providerResponseObject;
      }),
      catchError((error) => {
        const errorMessage: string = error.message;
        throw new Error(errorMessage);
      }),
    );
  }
}

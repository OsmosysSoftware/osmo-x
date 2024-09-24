import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { GraphqlService } from 'src/app/graphql/graphql.service';
import { GetApplications } from 'src/app/graphql/graphql.queries';
import { ApolloQueryResult } from '@apollo/client/core';
import { Application, ApplicationResponse } from './application.model';

interface GetApplicationsResponse {
  applications: {
    applications?: Application[];
    total?: number;
    offset?: number;
    limit?: number;
  };
}
@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  constructor(private graphqlService: GraphqlService) {}

  getApplications(variables, inputToken): Observable<ApplicationResponse> {
    return this.graphqlService.query(GetApplications, variables, inputToken).pipe(
      map((response: ApolloQueryResult<GetApplicationsResponse>) => {
        const applicationArray = response.data?.applications.applications;

        const applicationResponseObject: ApplicationResponse = {
          applications: [...applicationArray],
          total: response.data?.applications.total,
          offset: response.data?.applications.offset,
          limit: response.data?.applications.limit,
        };
        return applicationResponseObject;
      }),
      catchError((error) => {
        const errorMessage: string = error.message;
        throw new Error(errorMessage);
      }),
    );
  }
}

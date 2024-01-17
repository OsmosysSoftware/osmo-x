import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MutationResult } from 'apollo-angular';
import { GraphqlService } from '../graphql/graphql.service';
import { LoginUser } from '../graphql/graphql.queries';
import { LoginRequestBody } from './auth.interface';

const SESSION_EXPIRATION_DAYS = 30;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userData = null;

  constructor(private graphqlService: GraphqlService) {}

  isLoggedIn(): boolean {
    this.userData = JSON.parse(localStorage.getItem('osmoNotifyUserData'));

    if (!this.userData) {
      return false;
    }

    const loggedAt = localStorage.getItem('osmoNotifyLoggedAt');

    if (loggedAt) {
      const expirationDate = new Date(loggedAt);
      expirationDate.setDate(expirationDate.getDate() + SESSION_EXPIRATION_DAYS);
      const currentTime = new Date();
      return currentTime.getTime() < expirationDate.getTime();
    }

    return true;
  }

  loginUser(data: LoginRequestBody): Observable<MutationResult> {
    const variables = { username: data.username, password: data.password };
    return this.graphqlService.mutate(LoginUser, variables);
  }
}

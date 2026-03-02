import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserResponse, CreateUserInput, UpdateUserInput } from '../../../core/models/api.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  private readonly _users = signal<UserResponse[]>([]);
  readonly users = this._users.asReadonly();

  list(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.apiUrl).pipe(tap((users) => this._users.set(users)));
  }

  create(data: CreateUserInput): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, data);
  }

  update(data: UpdateUserInput): Observable<UserResponse> {
    return this.http.put<UserResponse>(this.apiUrl, data);
  }

  delete(userId: number): Observable<boolean> {
    return this.http.delete<boolean>(this.apiUrl, { body: { user_id: userId } });
  }
}

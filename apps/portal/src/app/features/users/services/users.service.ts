import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../../../core/models/auth.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/users`;

  private readonly _users = signal<User[]>([]);
  readonly users = this._users.asReadonly();

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(tap((users) => this._users.set(users)));
  }

  create(data: {
    username: string;
    password: string;
    email?: string;
    user_role: number;
  }): Observable<User> {
    return this.http.post<User>(this.apiUrl, data);
  }

  update(data: {
    user_id: number;
    username?: string;
    password?: string;
    email?: string;
    user_role?: number;
  }): Observable<User> {
    return this.http.put<User>(this.apiUrl, data);
  }
}

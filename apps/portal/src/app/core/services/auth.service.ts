import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginDto, RefreshTokenDto } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly STORAGE_KEY = 'auth_user';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';

  // Signal-based state management
  private readonly currentUser = signal<User | null>(null);
  readonly user = computed(() => this.currentUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(this.STORAGE_KEY);

    if (userJson) {
      try {
        const user = JSON.parse(userJson) as User;

        this.currentUser.set(user);
      } catch {
        this.clearStorage();
      }
    }
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/v1/auth/login`, dto).pipe(
      tap((response) => {
        this.handleAuthSuccess(response);
      }),
      catchError((error) => this.handleAuthError(error)),
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const dto: RefreshTokenDto = { refresh_token: refreshToken };

    return this.http.post<AuthResponse>(`${environment.apiUrl}/v1/auth/refresh`, dto).pipe(
      tap((response) => {
        this.handleAuthSuccess(response);
      }),
      catchError((error) => {
        this.logout();

        return throwError(() => error);
      }),
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/v1/auth/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(): void {
    this.clearStorage();
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isTokenExpired(): boolean {
    const token = this.getAccessToken();

    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;

      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh_token);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  private handleAuthError(error: unknown): Observable<never> {
    return throwError(() => error);
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginDto, RefreshTokenDto, JwtPayload } from '../models/auth.model';
import { UserRoles, UserRole } from '../constants/roles';

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

  // Role and organization signals
  readonly userRole = computed<UserRole | null>(() => {
    const user = this.currentUser();

    return user ? user.role : null;
  });

  readonly organizationId = computed<number | null>(() => {
    const user = this.currentUser();

    return user?.organization_id ?? null;
  });

  constructor() {
    this.loadUserFromStorage();
  }

  /**
   * Check if current user has ORG_ADMIN role or higher
   */
  isOrgAdmin(): boolean {
    const role = this.userRole();

    return role !== null && role >= UserRoles.ORG_ADMIN;
  }

  /**
   * Check if current user has SUPER_ADMIN role
   */
  isSuperAdmin(): boolean {
    return this.userRole() === UserRoles.SUPER_ADMIN;
  }

  /**
   * Check if user has at least the specified minimum role
   */
  hasMinimumRole(minimumRole: UserRole): boolean {
    const role = this.userRole();

    return role !== null && role >= minimumRole;
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
      const payload = this.decodeToken(token);

      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Decode the JWT access token to extract its payload.
   * Does NOT verify the signature -- that is the backend's responsibility.
   */
  decodeToken(token: string): JwtPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload) as JwtPayload;
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

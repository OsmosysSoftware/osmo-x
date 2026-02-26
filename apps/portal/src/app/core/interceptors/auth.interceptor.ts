import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip interceptor for auth endpoints to avoid circular calls
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh')
  ) {
    return next(req);
  }

  // Get access token
  const token = authService.getAccessToken();

  // Clone request and add authorization header if token exists
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  // Handle response
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 Unauthorized and we have a refresh token, try to refresh
      if (error.status === 401 && authService.getRefreshToken()) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry original request with new token
            const newToken = authService.getAccessToken();
            const retryReq = newToken
              ? req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                })
              : req;

            return next(retryReq);
          }),
          catchError((refreshError) => {
            // If refresh fails, logout user
            authService.logout();

            return throwError(() => refreshError);
          }),
        );
      }

      // For other errors, just pass them through
      return throwError(() => error);
    }),
  );
};

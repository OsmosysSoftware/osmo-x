import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip showing errors for auth endpoints - let the components handle those
      const skipErrorToast = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

      if (!skipErrorToast) {
        // Extract error message from RFC 7807 Problem JSON response
        const apiMessage = error.error?.detail || error.error?.message;
        let errorMessage = 'An error occurred';

        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to server';
            break;
          case 400:
            errorMessage = apiMessage || 'Invalid request';
            break;
          case 403:
            errorMessage = apiMessage || 'Access denied';
            break;
          case 404:
            errorMessage = apiMessage || 'Resource not found';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          case 503:
            errorMessage = 'Service unavailable';
            break;
          default:
            errorMessage = apiMessage || 'An unexpected error occurred';
        }

        messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000,
        });
      }

      return throwError(() => error);
    }),
  );
};

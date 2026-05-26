import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../models/auth.model';

class AuthServiceStub {
  accessToken: string | null = 'access-1';
  refreshTokenValue: string | null = 'refresh-1';

  refreshToken = jasmine
    .createSpy('refreshToken')
    .and.callFake(() => of({ access_token: 'access-2' } as AuthResponse));
  logout = jasmine.createSpy('logout');

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshTokenValue;
  }
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpController: HttpTestingController;
  let authService: AuthServiceStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;
  });

  afterEach(() => {
    httpController.verify();
  });

  it('adds Bearer Authorization header when an access token exists', () => {
    http.get('/api/notifications').subscribe();

    const req = httpController.expectOne('/api/notifications');

    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush({});
  });

  it('does not add an Authorization header when there is no access token', () => {
    authService.accessToken = null;

    http.get('/api/notifications').subscribe();

    const req = httpController.expectOne('/api/notifications');

    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('skips the interceptor entirely for /auth/login, /auth/register, and /auth/refresh', () => {
    http.post('/api/auth/login', {}).subscribe();
    http.post('/api/auth/register', {}).subscribe();
    http.post('/api/auth/refresh', {}).subscribe();

    const loginReq = httpController.expectOne('/api/auth/login');
    const registerReq = httpController.expectOne('/api/auth/register');
    const refreshReq = httpController.expectOne('/api/auth/refresh');

    expect(loginReq.request.headers.has('Authorization')).toBeFalse();
    expect(registerReq.request.headers.has('Authorization')).toBeFalse();
    expect(refreshReq.request.headers.has('Authorization')).toBeFalse();

    loginReq.flush({});
    registerReq.flush({});
    refreshReq.flush({});
  });

  it('on 401, calls refreshToken then retries the original request with the new token', () => {
    let observed: unknown = null;

    http.get('/api/notifications').subscribe((res) => (observed = res));

    const firstReq = httpController.expectOne('/api/notifications');

    expect(firstReq.request.headers.get('Authorization')).toBe('Bearer access-1');

    // Simulate refresh updating the token on the service.
    authService.refreshToken.and.callFake(() => {
      authService.accessToken = 'access-2';

      return of({ access_token: 'access-2' } as AuthResponse);
    });

    firstReq.flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.refreshToken).toHaveBeenCalledTimes(1);

    // Original request gets retried with the new token.
    const retryReq = httpController.expectOne('/api/notifications');

    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer access-2');
    retryReq.flush({ ok: true });

    expect(observed).toEqual({ ok: true });
  });

  it('on refresh failure, calls logout and propagates the refresh error', () => {
    const refreshErr = new HttpErrorResponse({ status: 500, statusText: 'boom' });

    authService.refreshToken.and.callFake(() => throwError(() => refreshErr));

    let captured: unknown = null;

    http.get('/api/notifications').subscribe({
      next: () => fail('should not succeed'),
      error: (err: unknown) => (captured = err),
    });

    const firstReq = httpController.expectOne('/api/notifications');

    firstReq.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(captured).toBe(refreshErr);
  });

  it('on 401 with no refresh token, propagates the error without calling refreshToken', () => {
    authService.refreshTokenValue = null;

    const captured: { value: HttpErrorResponse | null } = { value: null };

    http.get('/api/notifications').subscribe({
      next: () => fail('should not succeed'),
      error: (err: HttpErrorResponse) => {
        captured.value = err;
      },
    });

    const req = httpController.expectOne('/api/notifications');

    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.refreshToken).not.toHaveBeenCalled();
    expect(captured.value?.status).toBe(401);
  });

  it('on parallel 401 requests, characterises current behaviour: each request fires its own refresh', () => {
    // Documents the M10 race the audit flagged. If a future patch dedupes
    // refresh into a shared observable, this test must be updated to assert
    // the new contract.
    let firstResolved = false;
    let secondResolved = false;

    http.get('/api/a').subscribe(() => (firstResolved = true));
    http.get('/api/b').subscribe(() => (secondResolved = true));

    const reqA = httpController.expectOne('/api/a');
    const reqB = httpController.expectOne('/api/b');

    let tokenCounter = 1;

    authService.refreshToken.and.callFake(() => {
      tokenCounter += 1;
      authService.accessToken = `access-${tokenCounter}`;

      return of({ access_token: `access-${tokenCounter}` } as AuthResponse);
    });

    reqA.flush({}, { status: 401, statusText: 'Unauthorized' });
    reqB.flush({}, { status: 401, statusText: 'Unauthorized' });

    // Today: two separate refresh calls (one per request).
    expect(authService.refreshToken).toHaveBeenCalledTimes(2);

    const retryA = httpController.expectOne('/api/a');
    const retryB = httpController.expectOne('/api/b');

    retryA.flush({});
    retryB.flush({});

    expect(firstResolved).toBeTrue();
    expect(secondResolved).toBeTrue();
  });
});

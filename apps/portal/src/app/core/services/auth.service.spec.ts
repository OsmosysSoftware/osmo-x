import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';
import { AuthResponse, User } from '../models/auth.model';
import { UserRoles } from '../constants/roles';

class ConfigServiceStub {
  readonly apiUrl = 'http://test.local/api/v1';
  readonly apiDocsUrl = 'http://test.local/api/docs';

  load(): Promise<void> {
    return Promise.resolve();
  }
}

describe('AuthService', () => {
  let service: AuthService;
  let httpController: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ConfigService, useClass: ConfigServiceStub },
      ],
    });

    service = TestBed.inject(AuthService);
    httpController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpController.verify();
    localStorage.clear();
  });

  describe('refreshToken', () => {
    it('errors immediately when no refresh token is available and does not hit the network', () => {
      const captured: { value: Error | null } = { value: null };

      service.refreshToken().subscribe({
        next: () => fail('should not succeed'),
        error: (err: Error) => {
          captured.value = err;
        },
      });

      expect(captured.value?.message).toBe('No refresh token available');
      // No HTTP request should have been issued.
      httpController.expectNone(() => true);
    });

    it('POSTs to /auth/refresh with the refresh_token in the body', () => {
      localStorage.setItem('auth_refresh_token', 'refresh-abc');

      service.refreshToken().subscribe();

      const req = httpController.expectOne('http://test.local/api/v1/auth/refresh');

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refresh_token: 'refresh-abc' });
      req.flush({
        access_token: 'a',
        refresh_token: 'b',
        user: { user_id: 1, email: 'e', role: UserRoles.ORG_ADMIN, status: 1 } as User,
        expires_in: 3600,
      } satisfies AuthResponse);
    });

    it('on success: persists new tokens + user, and updates the user signal', () => {
      localStorage.setItem('auth_refresh_token', 'refresh-x');

      const newUser: User = {
        user_id: 99,
        email: 'rotated@x.com',
        role: UserRoles.ORG_ADMIN,
        status: 1,
      };

      service.refreshToken().subscribe();

      const req = httpController.expectOne('http://test.local/api/v1/auth/refresh');

      req.flush({
        access_token: 'access-new',
        refresh_token: 'refresh-new',
        user: newUser,
        expires_in: 3600,
      } satisfies AuthResponse);

      expect(localStorage.getItem('auth_token')).toBe('access-new');
      expect(localStorage.getItem('auth_refresh_token')).toBe('refresh-new');
      expect(service.user()?.user_id).toBe(99);
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('on failure: clears tokens, nulls the user signal, and navigates to /auth/login', () => {
      localStorage.setItem('auth_refresh_token', 'refresh-bad');
      localStorage.setItem('auth_token', 'still-here');
      localStorage.setItem(
        'auth_user',
        JSON.stringify({ user_id: 1, email: 'e', role: 1, status: 1 } satisfies User),
      );

      // Re-create service so it picks up the seeded user.
      const fresh = TestBed.inject(AuthService);

      expect(fresh.user()).not.toBeNull();

      const navSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

      fresh.refreshToken().subscribe({
        next: () => fail('should not succeed'),
        error: () => undefined,
      });

      const req = httpController.expectOne('http://test.local/api/v1/auth/refresh');

      req.flush({}, { status: 500, statusText: 'boom' });

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_refresh_token')).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();
      expect(fresh.user()).toBeNull();
      expect(navSpy).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from '../../../core/services/config.service';
import { ProfileService } from './profile';

describe('ProfileService', () => {
  const apiUrl = 'http://localhost:3000';

  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        // ConfigService reads its values from /assets/config.json at bootstrap and
        // throws if accessed before load() resolves, so it is stubbed here.
        { provide: ConfigService, useValue: { apiUrl, apiDocsUrl: `${apiUrl}/docs` } },
      ],
    });

    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should PUT profile updates to /users/profile', () => {
    service.updateProfile({ first_name: 'Ada', last_name: 'Lovelace' }).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/users/profile`);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ first_name: 'Ada', last_name: 'Lovelace' });
    req.flush({});
  });

  it('should POST password changes to /users/change-password', () => {
    service.changePassword({ current_password: 'old', new_password: 'new' }).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/users/change-password`);

    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});

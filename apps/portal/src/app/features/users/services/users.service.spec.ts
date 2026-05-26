import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { UsersService } from './users.service';
import { ConfigService } from '../../../core/services/config.service';
import { UserResponse } from '../../../core/models/api.model';

class ConfigServiceStub {
  readonly apiUrl = 'http://test.local/api/v1';
  readonly apiDocsUrl = 'http://test.local/api/docs';

  load(): Promise<void> {
    return Promise.resolve();
  }
}

describe('UsersService', () => {
  let service: UsersService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ConfigService, useClass: ConfigServiceStub },
      ],
    });

    service = TestBed.inject(UsersService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('list (characterisation: no pagination today)', () => {
    it('issues GET /users with NO page/limit query params', () => {
      service.list().subscribe();

      const req = httpController.expectOne('http://test.local/api/v1/users');

      expect(req.request.method).toBe('GET');
      // H7 in the audit: today the endpoint returns the full collection.
      expect(req.request.params.keys()).toEqual([]);
      req.flush([]);
    });

    it('updates the users signal with the full server response', () => {
      const users = [
        { user_id: 1, email: 'a@x', user_role: 0, status: 1 } as unknown as UserResponse,
        { user_id: 2, email: 'b@x', user_role: 1, status: 1 } as unknown as UserResponse,
        { user_id: 3, email: 'c@x', user_role: 2, status: 1 } as unknown as UserResponse,
      ];

      service.list().subscribe();

      const req = httpController.expectOne('http://test.local/api/v1/users');

      req.flush(users);

      expect(service.users()).toEqual(users);
    });

    it('emits the response array to subscribers', () => {
      const users: UserResponse[] = [
        { user_id: 7, email: 'g@x', user_role: 0, status: 1 } as unknown as UserResponse,
      ];
      const captured: { value: UserResponse[] | null } = { value: null };

      service.list().subscribe((res) => {
        captured.value = res;
      });

      const req = httpController.expectOne('http://test.local/api/v1/users');

      req.flush(users);

      expect(captured.value).toEqual(users);
    });
  });
});

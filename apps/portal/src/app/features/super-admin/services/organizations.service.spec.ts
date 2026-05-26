import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { OrganizationsService } from './organizations.service';
import { ConfigService } from '../../../core/services/config.service';
import { Organization } from '../../../core/models/api.model';

class ConfigServiceStub {
  readonly apiUrl = 'http://test.local/api/v1';
  readonly apiDocsUrl = 'http://test.local/api/docs';

  load(): Promise<void> {
    return Promise.resolve();
  }
}

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ConfigService, useClass: ConfigServiceStub },
      ],
    });

    service = TestBed.inject(OrganizationsService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('list (characterisation: no pagination today)', () => {
    it('issues GET /organizations with NO page/limit query params', () => {
      service.list().subscribe();

      const req = httpController.expectOne('http://test.local/api/v1/organizations');

      expect(req.request.method).toBe('GET');
      // H7 in the audit: today the endpoint returns the full collection.
      expect(req.request.params.keys()).toEqual([]);
      req.flush([]);
    });

    it('updates the organizations signal with the full server response', () => {
      const orgs = [
        { organization_id: 1, name: 'Acme' } as Organization,
        { organization_id: 2, name: 'Beta Co' } as Organization,
      ];

      service.list().subscribe();

      const req = httpController.expectOne('http://test.local/api/v1/organizations');

      req.flush(orgs);

      expect(service.organizations()).toEqual(orgs);
    });

    it('emits the response array to subscribers', () => {
      const orgs: Organization[] = [
        { organization_id: 5, name: 'Gamma' } as Organization,
      ];
      const captured: { value: Organization[] | null } = { value: null };

      service.list().subscribe((res) => {
        captured.value = res;
      });

      const req = httpController.expectOne('http://test.local/api/v1/organizations');

      req.flush(orgs);

      expect(captured.value).toEqual(orgs);
    });
  });
});

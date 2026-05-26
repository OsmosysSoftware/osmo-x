import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { OrgContextService } from './org-context.service';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';
import { OrganizationsService } from '../../features/super-admin/services/organizations.service';
import { Organization } from '../models/api.model';

class ConfigServiceStub {
  readonly apiUrl = 'http://test.local/api/v1';
  readonly apiDocsUrl = 'http://test.local/api/docs';

  load(): Promise<void> {
    return Promise.resolve();
  }
}

class AuthServiceStub {
  readonly isSuperAdminFlag = signal(false);
  readonly organizationIdValue = signal<number | null>(null);

  isSuperAdmin(): boolean {
    return this.isSuperAdminFlag();
  }

  organizationId(): number | null {
    return this.organizationIdValue();
  }
}

class OrganizationsServiceStub {
  readonly organizations = signal<Organization[]>([]);

  list(): { subscribe(): { unsubscribe(): void } } {
    return { subscribe: () => ({ unsubscribe: () => undefined }) };
  }
}

describe('OrgContextService', () => {
  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ConfigService, useClass: ConfigServiceStub },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: OrganizationsService, useClass: OrganizationsServiceStub },
      ],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('effectiveOrgId', () => {
    it('returns null when the user is not a SUPER_ADMIN regardless of internal selection', () => {
      const auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;

      auth.isSuperAdminFlag.set(false);

      const service = TestBed.inject(OrgContextService);

      service.selectOrg(99);

      expect(service.effectiveOrgId()).toBeNull();
    });

    it('returns the selected org id when the user is a SUPER_ADMIN', () => {
      const auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;

      auth.isSuperAdminFlag.set(true);

      const service = TestBed.inject(OrgContextService);

      service.selectOrg(7);

      expect(service.effectiveOrgId()).toBe(7);
    });

    it('returns null when SUPER_ADMIN explicitly clears the selection', () => {
      const auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;

      auth.isSuperAdminFlag.set(true);

      const service = TestBed.inject(OrgContextService);

      service.selectOrg(null);

      expect(service.effectiveOrgId()).toBeNull();
    });
  });

  describe('isAllOrgsMode', () => {
    it('is true only when SUPER_ADMIN has no org selected', () => {
      const auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;

      auth.isSuperAdminFlag.set(true);

      const service = TestBed.inject(OrgContextService);

      service.selectOrg(null);

      expect(service.isAllOrgsMode()).toBeTrue();
    });

    it('is false when SUPER_ADMIN has an org selected', () => {
      const auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;

      auth.isSuperAdminFlag.set(true);

      const service = TestBed.inject(OrgContextService);

      service.selectOrg(3);

      expect(service.isAllOrgsMode()).toBeFalse();
    });

    it('is false for ORG_ADMIN even if internal selection is null', () => {
      const auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;

      auth.isSuperAdminFlag.set(false);
      auth.organizationIdValue.set(42);

      const service = TestBed.inject(OrgContextService);

      service.selectOrg(null);

      expect(service.isAllOrgsMode()).toBeFalse();
    });
  });

  describe('sessionStorage persistence', () => {
    it('persists the selected org id to sessionStorage', () => {
      const auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;

      auth.isSuperAdminFlag.set(true);

      const service = TestBed.inject(OrgContextService);

      service.selectOrg(12);
      TestBed.tick();

      expect(sessionStorage.getItem('org_context_selected_org_id')).toBe('12');
    });

    it('removes the storage key when selection is cleared to null', () => {
      sessionStorage.setItem('org_context_selected_org_id', '5');

      const auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;

      auth.isSuperAdminFlag.set(true);

      const service = TestBed.inject(OrgContextService);

      service.selectOrg(null);
      TestBed.tick();

      expect(sessionStorage.getItem('org_context_selected_org_id')).toBeNull();
    });
  });
});

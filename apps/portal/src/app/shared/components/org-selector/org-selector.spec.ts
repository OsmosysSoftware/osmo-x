import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OrgSelectorComponent } from './org-selector';
import { OrgContextService } from '../../../core/services/org-context.service';
import { ConfigService } from '../../../core/services/config.service';
import { Organization } from '../../../core/models/api.model';

class ConfigServiceStub {
  readonly apiUrl = 'http://test.local/api/v1';
  readonly apiDocsUrl = 'http://test.local/api/docs';

  load(): Promise<void> {
    return Promise.resolve();
  }
}

class OrgContextServiceStub {
  readonly showOrgSelector = signal(true);
  readonly organizations = signal<Organization[]>([]);
  readonly effectiveOrgId = signal<number | null>(null);
  selectOrg = jasmine.createSpy('selectOrg');
  loadOrganizations = jasmine.createSpy('loadOrganizations');
}

describe('OrgSelectorComponent', () => {
  let fixture: ComponentFixture<OrgSelectorComponent>;
  let component: OrgSelectorComponent;
  let router: Router;
  let orgContext: OrgContextServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgSelectorComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ConfigService, useClass: ConfigServiceStub },
        { provide: OrgContextService, useClass: OrgContextServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrgSelectorComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    orgContext = TestBed.inject(OrgContextService) as unknown as OrgContextServiceStub;
  });

  describe('onOrgChange', () => {
    it('forwards the selected orgId to OrgContextService.selectOrg', () => {
      spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

      component.onOrgChange(42);

      expect(orgContext.selectOrg).toHaveBeenCalledWith(42);
    });

    it('navigates first to "/" with skipLocationChange:true, then back to the current url', async () => {
      Object.defineProperty(router, 'url', { value: '/notifications', configurable: true });

      const navSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

      component.onOrgChange(5);
      // Resolve the .then() callback.
      await Promise.resolve();

      expect(navSpy.calls.count()).toBe(2);
      expect(navSpy.calls.argsFor(0)).toEqual(['/', { skipLocationChange: true }]);
      expect(navSpy.calls.argsFor(1)).toEqual(['/notifications']);
    });

    it('accepts null to clear the selected org', () => {
      spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

      component.onOrgChange(null);

      expect(orgContext.selectOrg).toHaveBeenCalledWith(null);
    });
  });

  describe('ngOnInit', () => {
    it('calls loadOrganizations on init', () => {
      fixture.detectChanges();

      expect(orgContext.loadOrganizations).toHaveBeenCalled();
    });
  });
});

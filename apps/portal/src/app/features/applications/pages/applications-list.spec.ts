import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ApplicationsListComponent } from './applications-list';
import { ConfigService } from '../../../core/services/config.service';
import { Provider } from '../../../core/models/api.model';

class ConfigServiceStub {
  readonly apiUrl = 'http://test.local/api/v1';
  readonly apiDocsUrl = 'http://test.local/api/docs';

  load(): Promise<void> {
    return Promise.resolve();
  }
}

interface WhitelistRow {
  providerId: number | null;
  recipients: string[];
}

// Tiny helper that opens the component's private buildWhitelistPayload method
// via casting. Done in test code only so production stays encapsulated.
function buildPayload(
  component: ApplicationsListComponent,
): Record<string, string[]> | null {
  return (
    component as unknown as {
      buildWhitelistPayload(): Record<string, string[]> | null;
    }
  ).buildWhitelistPayload();
}

describe('ApplicationsListComponent', () => {
  let fixture: ComponentFixture<ApplicationsListComponent>;
  let component: ApplicationsListComponent;
  let httpController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        MessageService,
        ConfirmationService,
        { provide: ConfigService, useClass: ConfigServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListComponent);
    component = fixture.componentInstance;
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('getAvailableProviders', () => {
    let providers: Provider[];

    beforeEach(() => {
      providers = [
        { provider_id: 1, name: 'P1', application_id: 1, channel_type: 1 } as Provider,
        { provider_id: 2, name: 'P2', application_id: 1, channel_type: 2 } as Provider,
        { provider_id: 3, name: 'P3', application_id: 1, channel_type: 5 } as Provider,
      ];
      component.appProviders.set(providers);
    });

    it('returns the full provider list when the current row is the only row', () => {
      const row: WhitelistRow = { providerId: null, recipients: [] };

      component.whitelistRows.set([row]);

      expect(component.getAvailableProviders(row).map((p) => p.provider_id)).toEqual([
        1, 2, 3,
      ]);
    });

    it('excludes providers used in other rows but keeps the current row eligible', () => {
      const rowA: WhitelistRow = { providerId: 1, recipients: ['a@b.c'] };
      const rowB: WhitelistRow = { providerId: 2, recipients: [] };

      component.whitelistRows.set([rowA, rowB]);

      // Querying for rowB: rowA's provider (1) is excluded.
      // rowB's own selection (2) is NOT excluded — current row keeps its option.
      expect(component.getAvailableProviders(rowB).map((p) => p.provider_id)).toEqual([
        2, 3,
      ]);
    });

    it('treats rows with providerId=null as not-using-anything', () => {
      const rowA: WhitelistRow = { providerId: null, recipients: [] };
      const rowB: WhitelistRow = { providerId: 3, recipients: ['x'] };

      component.whitelistRows.set([rowA, rowB]);

      // From rowA's perspective: rowB blocks provider 3.
      expect(component.getAvailableProviders(rowA).map((p) => p.provider_id)).toEqual([
        1, 2,
      ]);
    });
  });

  describe('buildWhitelistPayload', () => {
    it('returns null when there are no whitelist rows', () => {
      component.whitelistRows.set([]);

      expect(buildPayload(component)).toBeNull();
    });

    it('returns null when rows exist but none have both a providerId and recipients', () => {
      component.whitelistRows.set([
        { providerId: null, recipients: ['a@b.c'] },
        { providerId: 1, recipients: [] },
      ]);

      expect(buildPayload(component)).toBeNull();
    });

    it('serialises providerId keys as strings mapped to their recipients array', () => {
      component.whitelistRows.set([
        { providerId: 1, recipients: ['a@b.c'] },
        { providerId: 2, recipients: ['x@y.z', 'q@w.e'] },
      ]);

      const payload = buildPayload(component);

      expect(payload).toEqual({
        '1': ['a@b.c'],
        '2': ['x@y.z', 'q@w.e'],
      });
    });

    it('drops rows with no recipients while keeping fully-populated rows', () => {
      component.whitelistRows.set([
        { providerId: 1, recipients: ['keep@me.com'] },
        { providerId: 2, recipients: [] },
        { providerId: 3, recipients: ['also@keep.com'] },
      ]);

      const payload = buildPayload(component);

      expect(payload).toEqual({
        '1': ['keep@me.com'],
        '3': ['also@keep.com'],
      });
    });

    it('drops rows with no providerId', () => {
      component.whitelistRows.set([
        { providerId: null, recipients: ['orphan@example.com'] },
        { providerId: 9, recipients: ['ok@example.com'] },
      ]);

      const payload = buildPayload(component);

      expect(payload).toEqual({ '9': ['ok@example.com'] });
    });
  });

  describe('whitelist row mutation save flow (characterization)', () => {
    // Pins TODAY's behaviour from H3 in the audit: when whitelistRows is
    // populated and formTestMode is true, save() sends the built payload.
    it('save() sends the built whitelist payload as whitelist_recipients on update', () => {
      component.editingApp.set({
        application_id: 50,
        name: 'Old Name',
        test_mode_enabled: 1,
      } as never);
      component.formName.set('New Name');
      component.formTestMode.set(true);
      component.whitelistRows.set([{ providerId: 7, recipients: ['who@me.com'] }]);

      component.save();

      const req = httpController.expectOne(
        (r) => r.url === 'http://test.local/api/v1/applications' && r.method === 'PUT',
      );

      expect(req.request.body).toEqual({
        application_id: 50,
        name: 'New Name',
        test_mode_enabled: 1,
        whitelist_recipients: { '7': ['who@me.com'] },
      });
      req.flush({});

      // success path triggers loadApplications() → GET — drain it.
      const reloadReq = httpController.expectOne(
        (r) => r.url === 'http://test.local/api/v1/applications' && r.method === 'GET',
      );

      reloadReq.flush({ items: [], page_info: null });
    });

    it('save() omits whitelist data (null) when test mode is OFF even if rows exist', () => {
      component.editingApp.set(null);
      component.formName.set('Brand New');
      component.formTestMode.set(false);
      // Rows are present but should be ignored when test mode is off.
      component.whitelistRows.set([{ providerId: 7, recipients: ['who@me.com'] }]);

      component.save();

      const req = httpController.expectOne(
        (r) => r.url === 'http://test.local/api/v1/applications' && r.method === 'POST',
      );

      expect(req.request.body).toEqual({
        name: 'Brand New',
        test_mode_enabled: 0,
        whitelist_recipients: null,
      });
      req.flush({});

      const reloadReq = httpController.expectOne(
        (r) => r.url === 'http://test.local/api/v1/applications' && r.method === 'GET',
      );

      reloadReq.flush({ items: [], page_info: null });
    });
  });
});

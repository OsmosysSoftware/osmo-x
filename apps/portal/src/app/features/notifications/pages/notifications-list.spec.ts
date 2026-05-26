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
import { MessageService } from 'primeng/api';
import { NotificationsListComponent } from './notifications-list';
import { ConfigService } from '../../../core/services/config.service';
import { Application, Provider } from '../../../core/models/api.model';

// Minimal stub returning a stable apiUrl without hitting fetch.
class ConfigServiceStub {
  readonly apiUrl = 'http://test.local/api/v1';
  readonly apiDocsUrl = 'http://test.local/api/docs';

  load(): Promise<void> {
    return Promise.resolve();
  }
}

describe('NotificationsListComponent', () => {
  let fixture: ComponentFixture<NotificationsListComponent>;
  let component: NotificationsListComponent;
  let httpController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsListComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        MessageService,
        { provide: ConfigService, useClass: ConfigServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsListComponent);
    component = fixture.componentInstance;
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('getApplicationName', () => {
    it('returns the application name when an exact match exists', () => {
      component.applications.set([
        { application_id: 1, name: 'Marketing' } as Application,
        { application_id: 2, name: 'Billing' } as Application,
      ]);

      expect(component.getApplicationName(2)).toBe('Billing');
    });

    it('returns the App #<id> fallback when no application matches', () => {
      component.applications.set([{ application_id: 1, name: 'Marketing' } as Application]);

      expect(component.getApplicationName(99)).toBe('App #99');
    });

    it('returns App #<id> when the applications list is empty', () => {
      component.applications.set([]);

      expect(component.getApplicationName(7)).toBe('App #7');
    });
  });

  describe('getProviderName', () => {
    it('returns the em-dash placeholder when providerId is null', () => {
      component.providers.set([
        { provider_id: 1, name: 'SMTP-A', application_id: 1 } as Provider,
      ]);

      expect(component.getProviderName(null)).toBe('—');
    });

    it('returns the em-dash placeholder when providerId is 0 (falsy)', () => {
      component.providers.set([
        { provider_id: 1, name: 'SMTP-A', application_id: 1 } as Provider,
      ]);

      // Documents current behaviour: any falsy id (incl. 0) gets the dash.
      expect(component.getProviderName(0)).toBe('—');
    });

    it('returns the provider name when an exact match exists', () => {
      component.providers.set([
        { provider_id: 10, name: 'Twilio-SMS', application_id: 1 } as Provider,
        { provider_id: 20, name: 'Mailgun-EU', application_id: 2 } as Provider,
      ]);

      expect(component.getProviderName(20)).toBe('Mailgun-EU');
    });

    it('returns Provider #<id> fallback when providerId is non-zero but not found', () => {
      component.providers.set([
        { provider_id: 10, name: 'Twilio-SMS', application_id: 1 } as Provider,
      ]);

      expect(component.getProviderName(42)).toBe('Provider #42');
    });
  });
});

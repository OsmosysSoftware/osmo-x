import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { NotificationsService } from './notifications.service';
import { ConfigService } from '../../../core/services/config.service';

class ConfigServiceStub {
  readonly apiUrl = 'http://test.local/api/v1';
  readonly apiDocsUrl = 'http://test.local/api/docs';

  load(): Promise<void> {
    return Promise.resolve();
  }
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ConfigService, useClass: ConfigServiceStub },
      ],
    });

    service = TestBed.inject(NotificationsService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('list', () => {
    it('sends GET /notifications with page+limit defaults and no filter params', () => {
      service.list().subscribe();

      const req = httpController.expectOne(
        (r) =>
          r.method === 'GET' && r.url === 'http://test.local/api/v1/notifications',
      );

      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('20');
      expect(req.request.params.keys().length).toBe(2);
      req.flush({ items: [], page_info: null });
    });

    it('maps all named filter fields to snake_case query params', () => {
      service
        .list(3, 50, {
          channel_type: 1,
          delivery_status: 5,
          application_id: 7,
          provider_id: 9,
          search: 'hello',
          date_from: '2026-01-01T00:00:00Z',
          date_to: '2026-01-31T00:00:00Z',
          sort: 'created_on',
          order: 'asc',
          recipient: 'a@b.c',
          sender: 'x@y.z',
          subject: 'Hi',
          message_body: 'body',
          template_name: 'tmpl',
        })
        .subscribe();

      const req = httpController.expectOne(
        (r) =>
          r.method === 'GET' && r.url === 'http://test.local/api/v1/notifications',
      );
      const p = req.request.params;

      expect(p.get('page')).toBe('3');
      expect(p.get('limit')).toBe('50');
      expect(p.get('channel_type')).toBe('1');
      expect(p.get('delivery_status')).toBe('5');
      expect(p.get('application_id')).toBe('7');
      expect(p.get('provider_id')).toBe('9');
      expect(p.get('search')).toBe('hello');
      expect(p.get('date_from')).toBe('2026-01-01T00:00:00Z');
      expect(p.get('date_to')).toBe('2026-01-31T00:00:00Z');
      expect(p.get('sort')).toBe('created_on');
      expect(p.get('order')).toBe('asc');
      expect(p.get('recipient')).toBe('a@b.c');
      expect(p.get('sender')).toBe('x@y.z');
      expect(p.get('subject')).toBe('Hi');
      expect(p.get('message_body')).toBe('body');
      expect(p.get('template_name')).toBe('tmpl');
      req.flush({ items: [], page_info: null });
    });

    it('serialises advancedFilters as data_filter[key]=value params (one per row)', () => {
      service
        .list(1, 20, {
          advancedFilters: [
            { id: 'r1', key: 'contentSid', value: 'CS123' },
            { id: 'r2', key: 'tracking_id', value: 'tk-9' },
          ],
        })
        .subscribe();

      const req = httpController.expectOne(
        (r) =>
          r.method === 'GET' && r.url === 'http://test.local/api/v1/notifications',
      );
      const p = req.request.params;

      expect(p.get('data_filter[contentSid]')).toBe('CS123');
      expect(p.get('data_filter[tracking_id]')).toBe('tk-9');
      req.flush({ items: [], page_info: null });
    });

    it('drops advancedFilters rows that have an empty key or value', () => {
      service
        .list(1, 20, {
          advancedFilters: [
            { id: 'r1', key: '', value: 'no-key' },
            { id: 'r2', key: 'present', value: '' },
            { id: 'r3', key: 'good', value: 'ok' },
          ],
        })
        .subscribe();

      const req = httpController.expectOne(
        (r) =>
          r.method === 'GET' && r.url === 'http://test.local/api/v1/notifications',
      );
      const p = req.request.params;

      expect(p.has('data_filter[good]')).toBeTrue();
      expect(p.get('data_filter[good]')).toBe('ok');
      expect(p.has('data_filter[]')).toBeFalse();
      expect(p.has('data_filter[present]')).toBeFalse();
      req.flush({ items: [], page_info: null });
    });

    it('updates the notifications signal on a successful response', () => {
      const items = [{ id: 1 }, { id: 2 }];

      service.list().subscribe();

      const req = httpController.expectOne(
        (r) =>
          r.method === 'GET' && r.url === 'http://test.local/api/v1/notifications',
      );

      req.flush({ items, page_info: null });

      expect(service.notifications()).toEqual(items as never);
    });
  });
});

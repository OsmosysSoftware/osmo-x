import { TestBed } from '@angular/core/testing';

import { JsencryptService } from './jsencrypt.service';

describe('JsencryptService', () => {
  let service: JsencryptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsencryptService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

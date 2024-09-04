import { TestBed } from '@angular/core/testing';

import { JSEncryptService } from './jsencrypt.service';

describe('JsencryptService', () => {
  let service: JSEncryptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JSEncryptService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should encrypt the plain text correctly', () => {
    const plainText = 'Hello, World!';
    const expectedEncryptedText =
      'mImAkGGALPGJ5JplLzHqx2CDQH7Ipwue3peTXRKZLehm+YnnFH+mhUCcOWGsOwhR/nkqq0nX3knp9lvr5EPtR4cZLjDTdgoS8L9XZEHZKBb3dcrw7CJ6ec/Z7UNuWJytNvEB4CJ6JsLaw9oqxEUoqQfdSyqHWjstPNW1llPeUwQ=';

    const encryptedText = service.encrypt(plainText);

    expect(encryptedText).toBe(expectedEncryptedText);
  });

  it('should decrypt the encrypted text correctly', () => {
    const encryptedText =
      'mImAkGGALPGJ5JplLzHqx2CDQH7Ipwue3peTXRKZLehm+YnnFH+mhUCcOWGsOwhR/nkqq0nX3knp9lvr5EPtR4cZLjDTdgoS8L9XZEHZKBb3dcrw7CJ6ec/Z7UNuWJytNvEB4CJ6JsLaw9oqxEUoqQfdSyqHWjstPNW1llPeUwQ=';
    const expectedPlainText = 'Hello, World!';

    const decryptedText = service.decrypt(encryptedText);

    expect(decryptedText).toBe(expectedPlainText);
  });
});

import { Injectable } from '@angular/core';
import JSEncrypt from 'jsencrypt';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class JSEncryptService {
  constructor() {}

  encrypt(text) {
    const jsEncrypt = new JSEncrypt();
    jsEncrypt.setPublicKey(environment.jsEncryptPublicKey);
    return jsEncrypt.encrypt(text);
  }

  decrypt(cipher) {
    const jsEncrypt = new JSEncrypt();
    jsEncrypt.setPrivateKey(environment.jsEncryptPrivateKey);
    return jsEncrypt.decrypt(cipher);
  }
}

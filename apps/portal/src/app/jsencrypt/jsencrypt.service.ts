import { Injectable } from '@angular/core';
import JSEncrypt from 'jsencrypt';

@Injectable({
  providedIn: 'root',
})
export class JSEncryptService {
  jsEncrypt;

  constructor() {
    this.jsEncrypt = new JSEncrypt();
  }

  encrypt(text) {
    this.jsEncrypt.setPublicKey(process.env.JSENCRYPT_PUBLIC_KEY);
    return this.jsEncrypt.encrypt(text);
  }

  decrypt(cipher) {
    this.jsEncrypt.setPrivateKey(process.env.JSENCRYPT_PRIVATE_KEY);
    return this.jsEncrypt.decrypt(cipher);
  }

  encryptLong(text) {
    const maxChunkLength = 100;
    let output = '';
    let inOffset = 0;

    while (inOffset < text.length) {
      output += this.encrypt(text.substring(inOffset, inOffset + maxChunkLength));
      inOffset += maxChunkLength;
    }

    return output;
  }

  decryptLong(string) {
    if (!string) return null;

    const maxChunkLength = 172;
    let output = '';
    let inOffset = 0;

    while (inOffset < string.length) {
      output += this.decrypt(string.substring(inOffset, inOffset + maxChunkLength));
      inOffset += maxChunkLength;
    }

    return output;
  }
}

import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { config } from 'dotenv';

config();
const configService = new ConfigService();

const algorithm = configService.getOrThrow<string>('ALGORITHM');
const key = Buffer.from(configService.getOrThrow<string>('KEY'), 'base64');

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    // Log the error or handle it as appropriate for your application
    throw new Error('Encryption failed');
  }
}

export function decrypt(text: string): string {
  try {
    const [ivText, encryptedText] = text.split(':');

    if (!ivText || !encryptedText) {
      throw new Error('Invalid input format');
    }

    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivText, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Log the error or handle it as appropriate for your application
    throw new Error('Decryption failed');
  }
}

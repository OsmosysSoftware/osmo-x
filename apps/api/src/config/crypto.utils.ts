import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { config } from 'dotenv';

config();
const configService = new ConfigService();

const algorithm = configService.getOrThrow<string>('ALGORITHM');
const key = Buffer.from(configService.getOrThrow<string>('KEY'), 'base64');
const iv = Buffer.from(configService.getOrThrow<string>('IV'), 'base64');

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string {
  const [ivText, encryptedText] = text.split(':');
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivText, 'hex'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

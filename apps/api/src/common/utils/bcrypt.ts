import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

const configService = new ConfigService();

// Define your salt rounds
const SALT_ROUNDS = configService.get<number>('SALT_ROUNDS');
const SECRET = configService.get<string>('API_KEY_SECRET');

export function encodePassword(rawPassword: string): string {
  const SALT = bcrypt.genSaltSync(SALT_ROUNDS);
  return bcrypt.hashSync(rawPassword, SALT);
}

export function comparePasswords(inputPassword: string, hash: string): boolean {
  return bcrypt.compareSync(inputPassword, hash);
}

// Function to encrypt the API key
export const encryptApiKey = async (originalApiKey: string): Promise<string> => {
  const keyToHash = `${originalApiKey}${SECRET}`;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const encryptedApiKey = await bcrypt.hash(keyToHash, salt);
  return encryptedApiKey;
};

// Function to compare the original API key with the stored hash
export const compareApiKeys = async (
  originalApiKey: string,
  encryptedApiKey: string,
): Promise<boolean> => {
  const keyToCompare = `${originalApiKey}${SECRET}`;
  const isMatch = await bcrypt.compare(keyToCompare, encryptedApiKey);
  return isMatch;
};

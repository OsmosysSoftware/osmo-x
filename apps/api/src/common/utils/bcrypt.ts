import * as bcrypt from 'bcrypt';

export function encodePassword(rawPassword: string): string {
  const saltRounds = 10;
  const SALT = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(rawPassword, SALT);
}

export function comparePasswords(inputPassword: string, hash: string): boolean {
  return bcrypt.compareSync(inputPassword, hash);
}

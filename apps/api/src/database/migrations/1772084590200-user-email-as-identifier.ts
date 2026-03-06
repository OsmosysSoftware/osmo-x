import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from 'dotenv';

config();

const DEFAULT_ADMIN_EMAIL = 'admin@osmox.dev';

export class UserEmailAsIdentifier1772084590200 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();

    // Add first_name and last_name columns
    await queryRunner.query(`
      ALTER TABLE notify_users
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)
    `);

    // For existing users without email, copy username (lowercased) into email
    await queryRunner.query(`
      UPDATE notify_users
      SET email = LOWER(username)
      WHERE email IS NULL
    `);

    // Normalize all existing emails to lowercase
    await queryRunner.query(`
      UPDATE notify_users
      SET email = LOWER(email)
      WHERE email IS NOT NULL
    `);

    // Set first_name for Admin user
    await queryRunner.query(
      `
      UPDATE notify_users
      SET first_name = 'Admin'
      WHERE email = $1
    `,
      [adminEmail],
    );

    // Make email NOT NULL
    await queryRunner.query(`
      ALTER TABLE notify_users
      ALTER COLUMN email SET NOT NULL
    `);

    // Add unique index on email
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_notify_users_email"
      ON notify_users (email)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop email unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_notify_users_email"
    `);

    // Make email nullable again
    await queryRunner.query(`
      ALTER TABLE notify_users
      ALTER COLUMN email DROP NOT NULL
    `);

    // Drop first_name and last_name columns
    await queryRunner.query(`
      ALTER TABLE notify_users
      DROP COLUMN IF EXISTS first_name,
      DROP COLUMN IF EXISTS last_name
    `);
  }
}

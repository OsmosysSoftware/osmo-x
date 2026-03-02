import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from 'dotenv';

config();

const DEFAULT_ADMIN_EMAIL = 'admin@osmox.dev';

export class SeedMultiTenancyData1772084590100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;

    // Upgrade existing Admin user to SUPER_ADMIN role (2) and set email
    await queryRunner.query(
      `
      UPDATE notify_users
      SET role = 2, email = $1
      WHERE username = 'Admin'
    `,
      [adminEmail],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Admin user to ORG_ADMIN role (1)
    await queryRunner.query(`
      UPDATE notify_users
      SET role = 1, email = NULL
      WHERE username = 'Admin'
    `);
  }
}

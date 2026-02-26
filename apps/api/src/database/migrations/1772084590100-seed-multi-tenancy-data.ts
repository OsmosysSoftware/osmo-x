import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMultiTenancyData1772084590100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Upgrade existing Admin user to SUPER_ADMIN role (2) and set email
    await queryRunner.query(`
      UPDATE notify_users
      SET role = 2, email = 'admin@osmox.dev'
      WHERE username = 'Admin'
    `);
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

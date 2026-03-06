import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationsAndMultiTenancy1772084589400 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create organizations table
    await queryRunner.query(`
      CREATE TABLE notify_organizations (
        organization_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status SMALLINT NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_notify_organizations_slug" ON notify_organizations (slug)
    `);

    // Add email column to users
    await queryRunner.query(`
      ALTER TABLE notify_users ADD COLUMN email VARCHAR(255)
    `);

    // Add organization_id to users
    await queryRunner.query(`
      ALTER TABLE notify_users ADD COLUMN organization_id INT
    `);

    // Add organization_id to applications
    await queryRunner.query(`
      ALTER TABLE notify_applications ADD COLUMN organization_id INT
    `);

    // Seed default organization
    await queryRunner.query(`
      INSERT INTO notify_organizations (name, slug) VALUES ('Default', 'default')
    `);

    // Backfill existing users and applications with default org
    await queryRunner.query(`
      UPDATE notify_users SET organization_id = 1
    `);

    await queryRunner.query(`
      UPDATE notify_applications SET organization_id = 1
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_notify_users_organization_id" ON notify_users (organization_id)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notify_applications_organization_id"
        ON notify_applications (organization_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notify_applications_organization_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_users_organization_id"`);
    await queryRunner.query(`ALTER TABLE notify_applications DROP COLUMN organization_id`);
    await queryRunner.query(`ALTER TABLE notify_users DROP COLUMN organization_id`);
    await queryRunner.query(`ALTER TABLE notify_users DROP COLUMN email`);
    await queryRunner.query(`DROP INDEX "IDX_notify_organizations_slug"`);
    await queryRunner.query(`DROP TABLE notify_organizations`);
  }
}

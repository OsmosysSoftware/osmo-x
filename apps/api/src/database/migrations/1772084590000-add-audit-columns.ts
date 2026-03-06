import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditColumns1772084590000 implements MigrationInterface {
  private readonly tables = [
    'notify_applications',
    'notify_providers',
    'notify_provider_chains',
    'notify_provider_chain_members',
    'notify_server_api_keys',
    'notify_users',
    'notify_webhooks',
    'notify_organizations',
    'notify_master_providers',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "created_by" integer`);
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "updated_by" integer`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "updated_by"`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "created_by"`);
    }
  }
}

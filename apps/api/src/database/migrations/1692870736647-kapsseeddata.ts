import { MigrationInterface, QueryRunner } from 'typeorm';

export class KapsSeedData1692870736647 implements MigrationInterface {
  name = 'KapsSeedData1692870736647';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration) VALUES (?, ?, ?)`,
      [
        'SMS_KAPSYSTEM',
        2,
        '{"KAP_SMS_BASE_API_URL": {"lable": "KAP SMS BASE API URL","id": "KAP_SMS_BASE_API_URL","pattern": "^https?://[^(\\?\\s)]+$","type": "string"},"KAP_SMS_ACCOUNT_USERNAME": {"lable": "KAP SMS ACCOUNT USERNAME","id": "KAP_SMS_ACCOUNT_USERNAME","pattern": "^[a-zA-Z0-9_-]{3,30}$","type": "string"},"KAP_SMS_ACCOUNT_PASSWORD": {"lable": "KAP_SMS_ACCOUNT_PASSWORD","id": "KAP SMS ACCOUNT PASSWORD","pattern": "^[a-zA-Z0-9_-]{3,30}$","type": "string"},"KAP_SMS_FROM": {"lable": "KAP SMS FROM","id": "KAP_SMS_FROM","pattern": "^[a-zA-Z]{6}$","type": "string"}}',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE master_id = 8;
    `);
  }
}

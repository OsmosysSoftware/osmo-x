import { MigrationInterface, QueryRunner } from 'typeorm';

export class AwsSesSeedData1722988740000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration) VALUES (?, ?, ?)`,
      [
        'AWS_SES',
        1,
        '{"AWS_ACCESS_KEY_ID":{"label":"AWS ACCESS KEY ID","id":"AWS_ACCESS_KEY_ID","pattern":"^[A-Z0-9]{20}$","type":"string"},"AWS_SECRET_ACCESS_KEY":{"label":"AWS SECRET ACCESS KEY","id":"AWS_SECRET_ACCESS_KEY","pattern":"^[A-Za-z0-9/+=]{40}$","type":"string"},"AWS_REGION":{"label":"AWS REGION","id":"AWS_REGION","pattern":"^[a-z]{2}-[a-z]+-\\d$","type":"string"}}',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE name = 'AWS_SES' AND provider_type = 1;
    `);
  }
}

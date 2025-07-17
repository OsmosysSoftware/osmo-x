import { MigrationInterface, QueryRunner } from 'typeorm';

export class DisableSMSKAPSystem1752750061568 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE notify_archived_notifications
      SET status = 0
      WHERE channel_type = (
        SELECT master_id
        FROM notify_master_providers
        WHERE name = 'SMS_KAPSYSTEM'
      );
    `);

    await queryRunner.query(`
      UPDATE notify_notifications
      SET status = 0
      WHERE channel_type = (
        SELECT master_id
        FROM notify_master_providers
        WHERE name = 'SMS_KAPSYSTEM'
      );
    `);

    await queryRunner.query(`
      UPDATE notify_providers
      SET status = 0
      WHERE channel_type = (
        SELECT master_id
        FROM notify_master_providers
        WHERE name = 'SMS_KAPSYSTEM'
      );
    `);

    await queryRunner.query(`
      UPDATE notify_master_providers
      SET status = 0
      WHERE name = 'SMS_KAPSYSTEM';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE notify_master_providers
      SET status = 1
      WHERE name = 'SMS_KAPSYSTEM';
    `);

    await queryRunner.query(`
      UPDATE notify_providers
      SET status = 1
      WHERE channel_type = (
        SELECT master_id
        FROM notify_master_providers
        WHERE name = 'SMS_KAPSYSTEM'
      );
    `);

    await queryRunner.query(`
      UPDATE notify_notifications
      SET status = 1
      WHERE channel_type = (
        SELECT master_id
        FROM notify_master_providers
        WHERE name = 'SMS_KAPSYSTEM'
      );
    `);

    await queryRunner.query(`
      UPDATE notify_archived_notifications
      SET status = 1
      WHERE channel_type = (
        SELECT master_id
        FROM notify_master_providers
        WHERE name = 'SMS_KAPSYSTEM'
      );
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DisableSMSKAPSystem1752750061568 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verify SMS_KAPSYSTEM provider exists
    const providerName = 'SMS_KAPSYSTEM';

    const provider = await queryRunner.query(
      `SELECT master_id FROM notify_master_providers WHERE name = $1`,
      [providerName],
    );

    if (!provider || provider.length === 0) {
      throw new Error(`${providerName} provider not found`);
    }

    const masterId = provider[0].master_id;

    await queryRunner.query(
      `UPDATE notify_archived_notifications
      SET status = 0
      WHERE channel_type = $1`,
      [masterId],
    );

    await queryRunner.query(
      `UPDATE notify_notifications
      SET status = 0
      WHERE channel_type = $1`,
      [masterId],
    );

    await queryRunner.query(
      `UPDATE notify_providers
      SET status = 0
      WHERE channel_type = $1`,
      [masterId],
    );

    await queryRunner.query(
      `UPDATE notify_master_providers
      SET status = 0
      WHERE name = $1`,
      [providerName],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verify SMS_KAPSYSTEM provider still exists
    const providerName = 'SMS_KAPSYSTEM';

    const provider = await queryRunner.query(
      `SELECT master_id FROM notify_master_providers
      WHERE name = $1`,
      [providerName],
    );

    if (!provider || provider.length === 0) {
      throw new Error(`${providerName} provider not found during rollback`);
    }

    const masterId = provider[0].master_id;

    await queryRunner.query(
      `UPDATE notify_master_providers
      SET status = 1
      WHERE name = $1`,
      [providerName],
    );

    await queryRunner.query(
      `UPDATE notify_providers
      SET status = 1
      WHERE channel_type = $1`,
      [masterId],
    );

    await queryRunner.query(
      `UPDATE notify_notifications
      SET status = 1
      WHERE channel_type = $1`,
      [masterId],
    );

    await queryRunner.query(
      `UPDATE notify_archived_notifications
      SET status = 1
      WHERE channel_type = $1`,
      [masterId],
    );
  }
}

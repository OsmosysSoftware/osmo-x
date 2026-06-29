import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRetryNotificationCreatedOnIndex1774000000200 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notify_notification_retries_created_on" ON "notify_notification_retries" ("created_on")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notify_notification_retries_created_on"`);
  }
}

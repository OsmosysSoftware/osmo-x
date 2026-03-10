import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompositeIndexesForDateFilter1773160413694 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Composite index for notifications: covers status + app filter + date sort/filter
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_notifications_status_app_created" ON "notify_notifications" ("status", "application_id", "created_on" DESC)`,
    );

    // Composite index for archived notifications: covers status + app filter + date sort/filter
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_archived_notifications_status_app_created" ON "notify_archived_notifications" ("status", "application_id", "created_on" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notify_archived_notifications_status_app_created"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_notifications_status_app_created"`);
  }
}

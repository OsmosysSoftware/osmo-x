import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArchivedDashboardIndexes1773420000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Composite index for dashboard aggregation: app + delivery status
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notify_archived_notifications_app_delivery" ON "notify_archived_notifications" ("application_id", "delivery_status")`,
    );

    // Provider index for dashboard provider stats joins
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notify_archived_notifications_provider_id" ON "notify_archived_notifications" ("provider_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notify_archived_notifications_provider_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notify_archived_notifications_app_delivery"`,
    );
  }
}

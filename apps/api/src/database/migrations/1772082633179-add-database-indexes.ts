import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabaseIndexes1772082633179 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // === UNIQUE CONSTRAINTS (auth/lookup critical) ===
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_notify_users_username" ON "notify_users" ("username")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_notify_server_api_keys_api_key" ON "notify_server_api_keys" ("api_key")`,
    );

    // === notify_notifications (CRITICAL - high volume table) ===
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_notifications_application_id" ON "notify_notifications" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_notifications_delivery_status" ON "notify_notifications" ("delivery_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_notifications_status" ON "notify_notifications" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_notifications_created_on" ON "notify_notifications" ("created_on" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_notifications_app_delivery" ON "notify_notifications" ("application_id", "delivery_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_notifications_provider_id" ON "notify_notifications" ("provider_id")`,
    );

    // === notify_archived_notifications (high volume) ===
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_archived_notifications_application_id" ON "notify_archived_notifications" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_archived_notifications_delivery_status" ON "notify_archived_notifications" ("delivery_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_archived_notifications_created_on" ON "notify_archived_notifications" ("created_on" DESC)`,
    );

    // === notify_notification_retries ===
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_notification_retries_notification_id" ON "notify_notification_retries" ("notification_id")`,
    );

    // === notify_applications ===
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_applications_user_id" ON "notify_applications" ("user_id")`,
    );

    // === notify_providers ===
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_providers_application_id" ON "notify_providers" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_providers_app_channel" ON "notify_providers" ("application_id", "channel_type", "is_enabled")`,
    );

    // === notify_provider_chains ===
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_provider_chains_application_id" ON "notify_provider_chains" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_provider_chains_app_default" ON "notify_provider_chains" ("application_id", "is_default")`,
    );

    // === notify_provider_chain_members ===
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_provider_chain_members_chain_id" ON "notify_provider_chain_members" ("chain_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_provider_chain_members_chain_active" ON "notify_provider_chain_members" ("chain_id", "is_active")`,
    );

    // === notify_server_api_keys ===
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_server_api_keys_application_id" ON "notify_server_api_keys" ("application_id")`,
    );

    // === notify_webhooks ===
    await queryRunner.query(
      `CREATE INDEX "IDX_notify_webhooks_provider_id" ON "notify_webhooks" ("provider_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notify_webhooks_provider_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_server_api_keys_application_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_provider_chain_members_chain_active"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_provider_chain_members_chain_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_provider_chains_app_default"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_provider_chains_application_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_providers_app_channel"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_providers_application_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_applications_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_notification_retries_notification_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_archived_notifications_created_on"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_archived_notifications_delivery_status"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_archived_notifications_application_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_notifications_provider_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_notifications_app_delivery"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_notifications_created_on"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_notifications_status"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_notifications_delivery_status"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_notifications_application_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_server_api_keys_api_key"`);
    await queryRunner.query(`DROP INDEX "IDX_notify_users_username"`);
  }
}

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class ArchiveCompletedNotifications1730724383210 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key from table notify_notification_retries
    const table = await queryRunner.getTable('notify_notification_retries');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('notification_id') !== -1,
    );
    await queryRunner.dropForeignKey('notify_notification_retries', foreignKey);

    // Create table archived_notifications
    await queryRunner.createTable(
      new Table({
        name: 'archived_notifications',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'notification_id',
            type: 'int',
            // Not adding a foreign key constraint because the original notifications will be deleted in cron process.
            // We want to retain archived notifications even if the original notifications are removed.
          },
          {
            name: 'channel_type',
            type: 'tinyint',
          },
          {
            name: 'data',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'delivery_status',
            type: 'tinyint',
            default: 1,
          },
          {
            name: 'result',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'varchar',
          },
          {
            name: 'updated_by',
            type: 'varchar',
          },
          {
            name: 'status',
            type: 'tinyint',
            default: 1,
          },
          {
            name: 'application_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'provider_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
          },
        ],
      }),
    );

    // Create foreign keys for table archived_notifications
    await queryRunner.createForeignKey(
      'archived_notifications',
      new TableForeignKey({
        columnNames: ['channel_type'],
        referencedColumnNames: ['master_id'],
        referencedTableName: 'notify_master_providers',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'archived_notifications',
      new TableForeignKey({
        columnNames: ['provider_id'],
        referencedColumnNames: ['provider_id'],
        referencedTableName: 'notify_providers',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Copy the entries in archived_notifications back to notify_notifications
    await queryRunner.query(`
      INSERT INTO notify_notifications (
        id, channel_type, data, delivery_status, result, created_on, updated_on,
        created_by, updated_by, status, application_id, provider_id, retry_count
      ) SELECT
        notification_id, channel_type, data, delivery_status, result, created_on, updated_on,
        created_by, updated_by, status, application_id, provider_id, retry_count
      FROM archived_notifications
    `);

    // Drop foreign keys from table archived_notifications
    const archived_notifications_table = await queryRunner.getTable('archived_notifications');
    const archived_notifications_providerIdforeignKey =
      archived_notifications_table?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('provider_id') !== -1,
      );

    if (archived_notifications_providerIdforeignKey) {
      await queryRunner.dropForeignKey(
        'archived_notifications',
        archived_notifications_providerIdforeignKey,
      );
    }

    const archived_notifications_channelTypeforeignKey =
      archived_notifications_table?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('channel_type') !== -1,
      );

    if (archived_notifications_channelTypeforeignKey) {
      await queryRunner.dropForeignKey(
        'archived_notifications',
        archived_notifications_channelTypeforeignKey,
      );
    }

    // Drop table archived_notifications
    await queryRunner.dropTable('archived_notifications');

    // Add foreign key again for table notify_notification_retries
    await queryRunner.createForeignKey(
      'notify_notification_retries',
      new TableForeignKey({
        columnNames: ['notification_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'notify_notifications',
        onDelete: 'CASCADE',
      }),
    );
  }
}

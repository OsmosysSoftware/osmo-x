import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class ArchiveCompletedNotifications1730724383210 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add index for table notify_notifications as archiving will be done based on delivery_status
    await queryRunner.createIndex(
      'notify_notifications',
      new TableIndex({
        name: 'IDX_DELIVERY_STATUS',
        columnNames: ['delivery_status'],
      }),
    );

    // Drop foreign key from table notify_notification_retries
    const table = await queryRunner.getTable('notify_notification_retries');

    if (!table) {
      throw new Error('Table notify_notification_retries does not exist');
    }

    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('notification_id') !== -1,
    );

    if (!foreignKey) {
      throw new Error('Foreign key on notification_id not found');
    }

    await queryRunner.dropForeignKey('notify_notification_retries', foreignKey);

    // Create table notify_archived_notifications
    await queryRunner.createTable(
      new Table({
        name: 'notify_archived_notifications',
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

    // Create foreign keys for table notify_archived_notifications
    await queryRunner.createForeignKey(
      'notify_archived_notifications',
      new TableForeignKey({
        columnNames: ['channel_type'],
        referencedColumnNames: ['master_id'],
        referencedTableName: 'notify_master_providers',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'notify_archived_notifications',
      new TableForeignKey({
        columnNames: ['provider_id'],
        referencedColumnNames: ['provider_id'],
        referencedTableName: 'notify_providers',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes to table notify_archived_notifications
    await queryRunner.createIndex(
      'notify_archived_notifications',
      new TableIndex({
        name: 'IDX_ARCHIVED_NOTIFICATION_ID',
        columnNames: ['notification_id'],
      }),
    );

    await queryRunner.createIndex(
      'notify_archived_notifications',
      new TableIndex({
        name: 'IDX_ARCHIVED_DELIVERY_STATUS',
        columnNames: ['delivery_status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Copy the entries in notify_archived_notifications back to notify_notifications
    await queryRunner.query(`
      INSERT INTO notify_notifications (
        id, channel_type, data, delivery_status, result, created_on, updated_on,
        created_by, updated_by, status, application_id, provider_id, retry_count
      ) SELECT
        notification_id, channel_type, data, delivery_status, result, created_on, updated_on,
        created_by, updated_by, status, application_id, provider_id, retry_count
      FROM notify_archived_notifications
    `);

    // Remove indexes from table notify_archived_notifications
    await queryRunner.dropIndex('notify_archived_notifications', 'IDX_ARCHIVED_NOTIFICATION_ID');
    await queryRunner.dropIndex('notify_archived_notifications', 'IDX_ARCHIVED_DELIVERY_STATUS');

    // Drop foreign keys from table notify_archived_notifications
    const notify_archived_notifications_table = await queryRunner.getTable(
      'notify_archived_notifications',
    );
    const notify_archived_notifications_providerIdforeignKey =
      notify_archived_notifications_table?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('provider_id') !== -1,
      );

    if (notify_archived_notifications_providerIdforeignKey) {
      await queryRunner.dropForeignKey(
        'notify_archived_notifications',
        notify_archived_notifications_providerIdforeignKey,
      );
    }

    const notify_archived_notifications_channelTypeforeignKey =
      notify_archived_notifications_table?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('channel_type') !== -1,
      );

    if (notify_archived_notifications_channelTypeforeignKey) {
      await queryRunner.dropForeignKey(
        'notify_archived_notifications',
        notify_archived_notifications_channelTypeforeignKey,
      );
    }

    // Drop table notify_archived_notifications
    await queryRunner.dropTable('notify_archived_notifications');

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

    // Remove index from notify_notifications table
    await queryRunner.dropIndex('notify_notifications', 'IDX_DELIVERY_STATUS');
  }
}

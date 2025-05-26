import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialMigration1745490872920 implements MigrationInterface {
  name = 'InitialMigration1745490872920';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Tables START --------------------------------------------------------
    await queryRunner.createTable(
      new Table({
        name: 'notify_users',
        columns: [
          {
            name: 'user_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'username',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'smallint',
            isNullable: false,
            default: 0,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'notify_master_providers',
        columns: [
          {
            name: 'master_id',
            type: 'smallint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'provider_type',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'configuration',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'notify_applications',
        columns: [
          {
            name: 'application_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
          {
            name: 'test_mode_enabled',
            type: 'smallint',
            isNullable: false,
            default: 0,
          },
          {
            name: 'whitelist_recipients',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'notify_providers',
        columns: [
          {
            name: 'provider_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            // Corresponds to master_id in notify_master_providers
            name: 'channel_type',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'is_enabled',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
          {
            name: 'configuration',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'application_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'notify_migrations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'timestamp',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'notify_notification_retries',
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
            isNullable: false,
          },
          {
            name: 'retry_count',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'retry_result',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'modified_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'modified_by',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
        ],
      }),
      true,
    );

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
            isNullable: false,
          },
          {
            name: 'channel_type',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'delivery_status',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
          {
            name: 'result',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
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
            isNullable: false,
            default: 0,
          },
          {
            name: 'notification_sent_on',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'notify_notifications',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'channel_type',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'data',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'delivery_status',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
          {
            name: 'result',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
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
            isNullable: false,
            default: 0,
          },
          {
            name: 'notification_sent_on',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'notify_server_api_keys',
        columns: [
          {
            name: 'api_key_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'api_key',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'application_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
          {
            name: 'masked_api_key',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'notify_webhooks',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'provider_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'webhook_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_verified',
            type: 'smallint',
            isNullable: false,
            default: 0,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
        ],
      }),
      true,
    );
    // Add Tables END ----------------------------------------------------------

    // Add Foreign Keys START --------------------------------------------------
    await queryRunner.createForeignKey(
      'notify_archived_notifications',
      new TableForeignKey({
        columnNames: ['provider_id'],
        referencedColumnNames: ['provider_id'],
        referencedTableName: 'notify_providers',
        onDelete: 'CASCADE',
      }),
    );

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
      'notify_notifications',
      new TableForeignKey({
        columnNames: ['channel_type'],
        referencedColumnNames: ['master_id'],
        referencedTableName: 'notify_master_providers',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'notify_notifications',
      new TableForeignKey({
        columnNames: ['provider_id'],
        referencedColumnNames: ['provider_id'],
        referencedTableName: 'notify_providers',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'notify_server_api_keys',
      new TableForeignKey({
        columnNames: ['application_id'],
        referencedColumnNames: ['application_id'],
        referencedTableName: 'notify_applications',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'notify_webhooks',
      new TableForeignKey({
        columnNames: ['provider_id'],
        referencedColumnNames: ['provider_id'],
        referencedTableName: 'notify_providers',
        onDelete: 'CASCADE',
      }),
    );
    // Add Foreign Keys END ----------------------------------------------------

    // Add Indexes START -------------------------------------------------------
    await queryRunner.createIndex(
      'notify_archived_notifications',
      new TableIndex({
        name: 'IDX_ARCHIVED_DELIVERY_STATUS',
        columnNames: ['delivery_status'],
      }),
    );

    await queryRunner.createIndex(
      'notify_archived_notifications',
      new TableIndex({
        name: 'IDX_ARCHIVED_NOTIFICATION_ID',
        columnNames: ['notification_id'],
      }),
    );

    await queryRunner.createIndex(
      'notify_notifications',
      new TableIndex({
        name: 'IDX_DELIVERY_STATUS',
        columnNames: ['delivery_status'],
      }),
    );
    // Add Indexes END ---------------------------------------------------------
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes START ------------------------------------------------------
    await queryRunner.dropIndex('notify_notifications', 'IDX_DELIVERY_STATUS');
    await queryRunner.dropIndex('notify_archived_notifications', 'IDX_ARCHIVED_NOTIFICATION_ID');
    await queryRunner.dropIndex('notify_archived_notifications', 'IDX_ARCHIVED_DELIVERY_STATUS');
    // Drop indexes END --------------------------------------------------------

    // Drop foreign keys START -------------------------------------------------
    // To drop the auto generated foreign key for notify_webhooks
    const notify_webhooks_table = await queryRunner.getTable('notify_webhooks');
    const notify_webhooks_foreignKey = notify_webhooks_table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('provider_id') !== -1,
    );
    await queryRunner.dropForeignKey('notify_webhooks', notify_webhooks_foreignKey);

    // To drop the auto generated foreign key for notify_server_api_keys
    const notify_server_api_keys_table = await queryRunner.getTable('notify_server_api_keys');
    const notify_server_api_keys_foreignKey = notify_server_api_keys_table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('application_id') !== -1,
    );

    if (notify_server_api_keys_foreignKey) {
      await queryRunner.dropForeignKey('notify_server_api_keys', notify_server_api_keys_foreignKey);
    }

    // To drop the auto generated foreign keys for notify_notifications
    const notify_notifications_table = await queryRunner.getTable('notify_notifications');
    const notify_notifications_providerId_foreignKey = notify_notifications_table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('provider_id') !== -1,
    );
    const notify_notifications_channelType_foreignKey =
      notify_notifications_table?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('channel_type') !== -1,
      );

    if (notify_notifications_providerId_foreignKey) {
      await queryRunner.dropForeignKey(
        'notify_notifications',
        notify_notifications_providerId_foreignKey,
      );
    }

    if (notify_notifications_channelType_foreignKey) {
      await queryRunner.dropForeignKey(
        'notify_notifications',
        notify_notifications_channelType_foreignKey,
      );
    }

    // To drop the auto generated foreign keys for notify_archived_notifications
    const notify_archived_notifications_table = await queryRunner.getTable(
      'notify_archived_notifications',
    );
    const notify_archived_notifications_providerId_foreignKey =
      notify_archived_notifications_table?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('provider_id') !== -1,
      );
    const notify_archived_notifications_channelType_foreignKey =
      notify_archived_notifications_table?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('channel_type') !== -1,
      );

    if (notify_archived_notifications_providerId_foreignKey) {
      await queryRunner.dropForeignKey(
        'notify_archived_notifications',
        notify_archived_notifications_providerId_foreignKey,
      );
    }

    if (notify_archived_notifications_channelType_foreignKey) {
      await queryRunner.dropForeignKey(
        'notify_archived_notifications',
        notify_archived_notifications_channelType_foreignKey,
      );
    }
    // Drop foreign keys END ---------------------------------------------------

    // Drop tables in reverse order of creation or based on dependencies
    await queryRunner.dropTable('notify_webhooks');
    await queryRunner.dropTable('notify_server_api_keys');
    await queryRunner.dropTable('notify_notifications');
    await queryRunner.dropTable('notify_archived_notifications');
    await queryRunner.dropTable('notify_notification_retries');
    await queryRunner.dropTable('notify_providers');
    await queryRunner.dropTable('notify_applications');
    await queryRunner.dropTable('notify_master_providers');
    await queryRunner.dropTable('notify_users');
  }
}

import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class Migration1692870736645 implements MigrationInterface {
  name = 'Migration1692870736645';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create new tables for multi-tenant architecture
    await queryRunner.createTable(
      new Table({
        name: 'notify_applications',
        columns: [
          {
            name: 'application_id',
            type: 'int',
            isPrimary: true,
            isUnique: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'user_id',
            type: 'int',
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
            name: 'status',
            type: 'tinyint',
            default: 1,
          },
        ],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'notify_server_api_keys',
        columns: [
          {
            name: 'api_key_id',
            type: 'int',
            isPrimary: true,
            isUnique: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'api_key',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'application_id',
            type: 'int',
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
            name: 'status',
            type: 'tinyint',
            default: 1,
          },
        ],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'notify_providers',
        columns: [
          {
            name: 'provider_id',
            type: 'int',
            isPrimary: true,
            isUnique: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'channel_type',
            type: 'tinyint',
          },
          {
            name: 'is_enabled',
            type: 'tinyint',
            default: 1,
          },
          {
            name: 'configuration',
            type: 'text',
          },
          {
            name: 'application_id',
            type: 'int',
          },
          {
            name: 'user_id',
            type: 'int',
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
            name: 'status',
            type: 'tinyint',
            default: 1,
          },
        ],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'notify_users',
        columns: [
          {
            name: 'user_id',
            type: 'int',
            isPrimary: true,
            isUnique: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'username',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'role',
            type: 'tinyint',
            default: 0,
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
            name: 'status',
            type: 'tinyint',
            default: 1,
          },
        ],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'notify_master_providers',
        columns: [
          {
            name: 'master_id',
            type: 'tinyint',
            isPrimary: true,
            isUnique: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'provider_type',
            type: 'tinyint',
          },
          {
            name: 'configuration',
            type: 'text',
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
            name: 'status',
            type: 'tinyint',
            default: 1,
          },
        ],
      }),
    );

    // Add application_id column in notify_notifications
    await queryRunner.addColumn(
      'notify_notifications',
      new TableColumn({
        name: 'application_id',
        type: 'int',
        // Kept as null for now
        isNullable: true,
        default: null,
      }),
    );

    // Add provider_id column in notify_notifications
    await queryRunner.addColumn(
      'notify_notifications',
      new TableColumn({
        name: 'provider_id',
        type: 'int',
        // Kept as null for now
        isNullable: true,
        default: null,
      }),
    );

    // Create foreign key for notify_server_api_keys
    await queryRunner.createForeignKey(
      'notify_server_api_keys',
      new TableForeignKey({
        columnNames: ['application_id'],
        referencedColumnNames: ['application_id'],
        referencedTableName: 'notify_applications',
        onDelete: 'CASCADE',
      }),
    );

    // Create Foreign keys for notify_notifications
    await queryRunner.createForeignKey(
      'notify_notifications',
      new TableForeignKey({
        columnNames: ['provider_id'],
        referencedColumnNames: ['provider_id'],
        referencedTableName: 'notify_providers',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // To drop the auto generated foreign key for notify_notifications
    const notify_notifications_table = await queryRunner.getTable('notify_notifications');
    const notify_notifications_foreignKey = notify_notifications_table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('provider_id') !== -1,
    );

    if (notify_notifications_foreignKey) {
      await queryRunner.dropForeignKey('notify_notifications', notify_notifications_foreignKey);
    }

    // To drop the auto generated foreign key for notify_server_api_keys
    const notify_server_api_keys_table = await queryRunner.getTable('notify_server_api_keys');
    const notify_server_api_keys_foreignKey = notify_server_api_keys_table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('application_id') !== -1,
    );

    if (notify_server_api_keys_foreignKey) {
      await queryRunner.dropForeignKey('notify_server_api_keys', notify_server_api_keys_foreignKey);
    }

    // Rest of the drop commands
    await queryRunner.dropColumn('notify_notifications', 'provider_id');
    await queryRunner.dropColumn('notify_notifications', 'application_id');
    await queryRunner.query(`DROP TABLE \`notify_server_api_keys\``);
    await queryRunner.query(`DROP TABLE \`notify_applications\``);
    await queryRunner.query(`DROP TABLE \`notify_providers\``);
    await queryRunner.query(`DROP TABLE \`notify_master_providers\``);
    await queryRunner.query(`DROP TABLE \`notify_users\``);
  }
}

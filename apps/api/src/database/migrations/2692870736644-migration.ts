/* eslint-disable prettier/prettier */
import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class Migration2692870736644 implements MigrationInterface {
  name = 'Migration2692870736644';

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
            isGenerated: true,
            isUnique: true,
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
            name: 'application_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            isUnique: true,
          },
          {
            name: 'api_key',
            type: 'varchar',
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
            isGenerated: true,
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
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
            isGenerated: true,
            isUnique: true,
            generationStrategy: 'increment',
          },
          {
            name: 'username',
            type: 'varchar',
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
        name: 'notify_master_providers',
        columns: [
          {
            name: 'provider_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            isUnique: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['sms', 'email', 'whatsapp', 'others'],
            default: "'sms'",
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

    // Add a column in notify_notifications
    await queryRunner.addColumn(
      'notify_notifications',
      new TableColumn({
        name: 'application_id',
        type: 'int',
      }),
    );

    // Create Foreign key for this table
    await queryRunner.createForeignKey(
      'notify_notifications',
      new TableForeignKey({
        columnNames: ['application_id'],
        referencedColumnNames: ['application_id'],
        referencedTableName: 'notify_applications',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('notify_notifications', 'application_id');
    await queryRunner.dropColumn('notify_notifications', 'application_id');
    await queryRunner.query(`DROP TABLE \`notify_applications\``);
    await queryRunner.query(`DROP TABLE \`notify_server_api_keys\``);
    await queryRunner.query(`DROP TABLE \`notify_providers\``);
    await queryRunner.query(`DROP TABLE \`notify_users\``);
    await queryRunner.query(`DROP TABLE \`notify_master_providers\``);
  }
}
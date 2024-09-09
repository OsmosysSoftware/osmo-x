import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddRetryTable1723401906112 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
          },
          {
            name: 'retry_count',
            type: 'int',
          },
          {
            name: 'retry_result',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'modified_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
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
            type: 'tinyint',
            default: 1,
          },
        ],
      }),
    );

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('notify_notification_retries');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('notification_id') !== -1,
    );
    await queryRunner.dropForeignKey('notify_notification_retries', foreignKey);
    await queryRunner.dropTable('notify_notification_retries');
  }
}

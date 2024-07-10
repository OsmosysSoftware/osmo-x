import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddWebhookTable1720458965605 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
          },
          {
            name: 'webhookUrl',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_verified',
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
        ],
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('notify_webhooks');
    const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('provider_id') !== -1);
    await queryRunner.dropForeignKey('notify_webhooks', foreignKey);
    await queryRunner.dropTable('notify_webhooks');
  }
}

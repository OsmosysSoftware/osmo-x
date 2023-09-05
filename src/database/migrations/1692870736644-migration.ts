import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Migration1692870736644 implements MigrationInterface {
  name = 'Migration1692870736644';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
            type: 'tinyint',
          },
          {
            name: 'data',
            type: 'text',
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
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`notifications\``);
  }
}

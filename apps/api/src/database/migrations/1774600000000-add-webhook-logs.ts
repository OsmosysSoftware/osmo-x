import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

export class AddWebhookLogs1774600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notify_webhook_logs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'webhook_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'notification_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'attempt_number',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'http_status_code',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'request_body',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'response_body',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requested_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'created_on',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'int',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'notify_webhook_logs',
      new TableIndex({
        name: 'IDX_notify_webhook_logs_webhook_id',
        columnNames: ['webhook_id'],
      }),
    );

    await queryRunner.createIndex(
      'notify_webhook_logs',
      new TableIndex({
        name: 'IDX_notify_webhook_logs_notification_id',
        columnNames: ['notification_id'],
      }),
    );

    await queryRunner.createIndex(
      'notify_webhook_logs',
      new TableIndex({
        name: 'IDX_notify_webhook_logs_created_on',
        columnNames: ['created_on'],
      }),
    );

    await queryRunner.addColumn(
      'notify_webhooks',
      new TableColumn({
        name: 'last_delivery_status',
        type: 'smallint',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'notify_webhooks',
      new TableColumn({
        name: 'last_attempted_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('notify_webhooks', 'last_attempted_at');
    await queryRunner.dropColumn('notify_webhooks', 'last_delivery_status');
    await queryRunner.dropTable('notify_webhook_logs');
  }
}

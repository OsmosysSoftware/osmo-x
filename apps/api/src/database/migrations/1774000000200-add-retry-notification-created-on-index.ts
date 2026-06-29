import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddRetryNotificationCreatedOnIndex1774000000200 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'notify_notification_retries',
      new TableIndex({
        name: 'IDX_notify_notification_retries_created_on',
        columnNames: ['created_on'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'notify_notification_retries',
      'IDX_notify_notification_retries_created_on',
    );
  }
}

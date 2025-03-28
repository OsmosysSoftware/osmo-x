import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNotificationSentOnColumn1743145236864 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'notify_archived_notifications',
      new TableColumn({
        name: 'notification_sent_on',
        type: 'timestamp',
      }),
    );

    await queryRunner.query(`
      UPDATE notify_archived_notifications
      SET notification_sent_on = updated_on;
    `);

    await queryRunner.addColumn(
      'notify_notifications',
      new TableColumn({
        name: 'notification_sent_on',
        type: 'timestamp',
      }),
    );

    await queryRunner.query(`
      UPDATE notify_notifications
      SET notification_sent_on = updated_on;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE notify_notifications
      SET updated_on = notification_sent_on;
    `);

    await queryRunner.dropColumn('notify_notifications', 'notification_sent_on');

    await queryRunner.query(`
      UPDATE notify_archived_notifications
      SET updated_on = notification_sent_on;
    `);

    await queryRunner.dropColumn('notify_archived_notifications', 'notification_sent_on');
  }
}

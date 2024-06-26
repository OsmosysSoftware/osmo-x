import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRetryCountColumn1719299457601 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('notify_notifications', {
      name: 'retry_count',
      type: 'int',
      length: '3',
      default: 0,
    } as TableColumn);
    // Need to handle migration for setting proper delivery_status
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('notify_notifications', 'retry_count');
  }
}
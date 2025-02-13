import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTestModeFeature1739428222589 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'notify_applications',
      new TableColumn({
        name: 'test_mode_enabled',
        type: 'tinyint',
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      'notify_applications',
      new TableColumn({
        name: 'whitelist_recipients',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('notify_applications', 'whitelist_recipients');
    await queryRunner.dropColumn('notify_applications', 'test_mode_enabled');
  }
}

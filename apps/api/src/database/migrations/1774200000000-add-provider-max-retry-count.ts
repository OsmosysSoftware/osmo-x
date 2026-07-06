import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProviderMaxRetryCount1774200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'notify_providers',
      new TableColumn({
        name: 'max_retry_count',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('notify_providers', 'max_retry_count');
  }
}

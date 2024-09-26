import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMaskedKeyColumn1727156770079 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'notify_server_api_keys',
      new TableColumn({
        name: 'masked_api_key',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('notify_server_api_keys', 'masked_api_key');
  }
}

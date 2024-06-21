import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDataColumnType1718945071282 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update the 'data' column type to LONGTEXT
    await queryRunner.query(`
            ALTER TABLE notify_notifications MODIFY COLUMN data LONGTEXT;
        `);

    // Update the 'result' column type to LONGTEXT
    await queryRunner.query(`
            ALTER TABLE notify_notifications MODIFY COLUMN result LONGTEXT;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the 'data' column type to its previous type (assuming TEXT)
    await queryRunner.query(`
            ALTER TABLE notify_notifications MODIFY COLUMN data TEXT;
        `);

    // Revert the 'result' column type to its previous type (assuming TEXT)
    await queryRunner.query(`
            ALTER TABLE notify_notifications MODIFY COLUMN result TEXT;
        `);
  }
}

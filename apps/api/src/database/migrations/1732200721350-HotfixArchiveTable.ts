import { MigrationInterface, QueryRunner } from 'typeorm';

export class HotfixArchiveTable1732200721350 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update the 'data' column type to LONGTEXT
    await queryRunner.query(`
      ALTER TABLE notify_archived_notifications MODIFY COLUMN data LONGTEXT;
    `);

    // Update the 'result' column type to LONGTEXT
    await queryRunner.query(`
      ALTER TABLE notify_archived_notifications MODIFY COLUMN result LONGTEXT;
    `);

    // Update the 'retry_count' column to INT(3)
    await queryRunner.query(`
      ALTER TABLE notify_archived_notifications MODIFY COLUMN retry_count INT(3) NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the 'retry_count' column to its previous type - INT(11)
    await queryRunner.query(`
      ALTER TABLE notify_archived_notifications MODIFY COLUMN retry_count INT(11) NOT NULL DEFAULT 0;
    `);

    // Revert the 'result' column type to its previous type - TEXT
    await queryRunner.query(`
      ALTER TABLE notify_archived_notifications MODIFY COLUMN result TEXT;
    `);

    // Revert the 'data' column type to its previous type - TEXT
    await queryRunner.query(`
      ALTER TABLE notify_archived_notifications MODIFY COLUMN data TEXT;
    `);
  }
}

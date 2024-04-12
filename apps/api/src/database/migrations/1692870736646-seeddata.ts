import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedData1692870736646 implements MigrationInterface {
  name = 'SeedData1692870736646';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert sample data into a table
    await queryRunner.query(`
      INSERT INTO notify_applications (application_id,name,user_id,created_on,updated_on,status) VALUES
      (1001,'sampleOsmoXApp',1,'2024-04-12 11:36:02','2024-04-12 11:36:02',1),
      (1002,'sampleFoundationApp',2,'2024-04-12 11:36:10','2024-04-12 11:36:10',1);
    `);

    await queryRunner.query(`
      INSERT INTO notify_server_api_keys (api_key,application_id,created_on,updated_on,status) VALUES
      ('OsmoX-test-key',1001,'2024-04-12 12:28:06','2024-04-12 12:28:06',1),
      ('FoundationX-test-key',1002,'2024-04-12 12:37:40','2024-04-12 12:37:40',1);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM notify_server_api_keys
      WHERE id IN (1, 2);
    `);
    await queryRunner.query(`
      DELETE FROM notify_applications
      WHERE id IN (1, 2);
    `);
  }
}

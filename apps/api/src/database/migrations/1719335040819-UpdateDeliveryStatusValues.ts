import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDeliveryStatusValues1719335040819 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE notify_notifications
        SET delivery_status = CASE
            WHEN delivery_status = 3 THEN 5
            WHEN delivery_status = 4 THEN 6
            ELSE delivery_status
        END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE notify_notifications
        SET delivery_status = CASE
            WHEN delivery_status = 5 THEN 3
            WHEN delivery_status = 6 THEN 4
            ELSE delivery_status
        END;
    `);
  }
}

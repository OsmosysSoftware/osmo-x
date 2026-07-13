import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermittedApplicationIds1774500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notify_users" ADD COLUMN IF NOT EXISTS "permitted_application_ids" integer[]`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notify_users" DROP COLUMN IF EXISTS "permitted_application_ids"`,
    );
  }
}

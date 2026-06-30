import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertPermittedApplicationIdsToIntArray1774500000100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // simple-json stores arrays as JSON text e.g. "[1,2,3]".
    // translate swaps [] → {} producing the PostgreSQL array literal "{1,2,3}".
    await queryRunner.query(
      `ALTER TABLE "notify_users"
       ALTER COLUMN "permitted_application_ids" TYPE integer[]
       USING translate(permitted_application_ids, '[]', '{}')::integer[]`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notify_users"
       ALTER COLUMN "permitted_application_ids" TYPE text
       USING array_to_json(permitted_application_ids)::text`,
    );
  }
}

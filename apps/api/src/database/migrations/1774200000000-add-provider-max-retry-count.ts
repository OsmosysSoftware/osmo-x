import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProviderMaxRetryCount1774200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notify_providers" ADD COLUMN "max_retry_count" integer NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notify_providers" DROP COLUMN "max_retry_count"`);
  }
}

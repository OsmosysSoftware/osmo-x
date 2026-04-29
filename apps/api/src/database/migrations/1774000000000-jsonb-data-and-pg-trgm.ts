import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migrate notify_notifications.data, .result and notify_archived_notifications.data,
 * .result columns from `json` to `jsonb` so they support GIN indexes and richer
 * JSON predicates.
 *
 * Also installs the pg_trgm extension and adds whole-jsonb GIN indexes on the
 * data columns. The pg_trgm trigram indexes on (data->>'subject'/'from'/'to')
 * are added by the follow-up migration JsonbTrigramIndexes1774000000100, which
 * uses CREATE INDEX CONCURRENTLY (and therefore must run outside a transaction).
 *
 * Caveats:
 *   - ALTER COLUMN ... TYPE jsonb takes ACCESS EXCLUSIVE on the table and rewrites
 *     all rows. Run during a maintenance window for large tables.
 *   - jsonb deduplicates duplicate keys silently. The cast cannot fail on existing
 *     duplicates, but any code that produced duplicate-key JSON in `data` or
 *     `result` will now lose one of the duplicates after the migration.
 *   - Free-text search (CAST(data AS text) ILIKE :search) behaviour changes subtly:
 *     json preserves original whitespace, key order, and duplicate keys; jsonb strips
 *     whitespace, reorders keys, and deduplicates. Substring searches on values
 *     (the common case) are unaffected. Searches that relied on specific key ordering
 *     or whitespace in the serialized text will silently change results.
 *
 * The default jsonb GIN opclass accelerates @> and ? operators (containment).
 * It does NOT accelerate `->>` `ILIKE`; the pg_trgm trigram indexes do.
 *
 * Prerequisites / privileges:
 *   - pg_trgm is a trusted extension (PostgreSQL 13+). Any role with CREATE on the
 *     database can install it. On PG 12 and earlier, or on RDS without the
 *     rds_superuser grant, the migration role must have superuser or explicit
 *     CREATE EXTENSION privilege. Verify before running on staging/production.
 *
 * Rollback order:
 *   If JsonbTrigramIndexes1774000000100 has already been applied, revert it first
 *   (npm run typeorm:revert-migration) before reverting this migration. The trigram
 *   expression indexes reference (data->>'...') which becomes invalid once the column
 *   reverts to the json type.
 */
export class JsonbDataAndPgTrgm1774000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await queryRunner.query(
      `ALTER TABLE "notify_notifications" ALTER COLUMN "data" TYPE jsonb USING "data"::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "notify_notifications" ALTER COLUMN "result" TYPE jsonb USING "result"::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "notify_archived_notifications" ALTER COLUMN "data" TYPE jsonb USING "data"::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "notify_archived_notifications" ALTER COLUMN "result" TYPE jsonb USING "result"::jsonb`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notify_notifications_data_gin" ON "notify_notifications" USING GIN ("data")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notify_archived_notifications_data_gin" ON "notify_archived_notifications" USING GIN ("data")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notify_archived_notifications_data_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notify_notifications_data_gin"`);

    await queryRunner.query(
      `ALTER TABLE "notify_archived_notifications" ALTER COLUMN "result" TYPE json USING "result"::json`,
    );
    await queryRunner.query(
      `ALTER TABLE "notify_archived_notifications" ALTER COLUMN "data" TYPE json USING "data"::json`,
    );
    await queryRunner.query(
      `ALTER TABLE "notify_notifications" ALTER COLUMN "result" TYPE json USING "result"::json`,
    );
    await queryRunner.query(
      `ALTER TABLE "notify_notifications" ALTER COLUMN "data" TYPE json USING "data"::json`,
    );

    // The pg_trgm extension is left installed; harmless and may be used elsewhere.
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add pg_trgm GIN trigram expression indexes on the hot named-filter keys
 * (data->>'subject', data->>'from', data->>'to') for both notify_notifications
 * and notify_archived_notifications.
 *
 * These indexes accelerate `ILIKE '%v%'` (substring, case-insensitive) — exactly
 * what NotificationDataFilterHelper emits. A plain B-tree on (data->>'k') cannot
 * accelerate ILIKE; text_pattern_ops only helps case-sensitive prefix LIKE.
 * Trigram indexes require ≥ 3 character search patterns to be useful; shorter
 * patterns seq-scan regardless.
 *
 * CRITICAL: CREATE INDEX CONCURRENTLY cannot run inside a transaction. TypeORM
 * wraps migrations transactionally by default, so we set `transaction = false`.
 * This keeps the lock window minimal — these indexes can be large on production
 * data and CONCURRENTLY avoids blocking writes during the build.
 */
export class JsonbTrigramIndexes1774000000100 implements MigrationInterface {
  public readonly transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const indexes: Array<{ name: string; table: string; key: string }> = [
      {
        name: 'IDX_notify_notifications_data_subject_trgm',
        table: 'notify_notifications',
        key: 'subject',
      },
      {
        name: 'IDX_notify_notifications_data_from_trgm',
        table: 'notify_notifications',
        key: 'from',
      },
      {
        name: 'IDX_notify_notifications_data_to_trgm',
        table: 'notify_notifications',
        key: 'to',
      },
      {
        name: 'IDX_notify_archived_notifications_data_subject_trgm',
        table: 'notify_archived_notifications',
        key: 'subject',
      },
      {
        name: 'IDX_notify_archived_notifications_data_from_trgm',
        table: 'notify_archived_notifications',
        key: 'from',
      },
      {
        name: 'IDX_notify_archived_notifications_data_to_trgm',
        table: 'notify_archived_notifications',
        key: 'to',
      },
    ];

    for (const { name, table, key } of indexes) {
      await queryRunner.query(
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${name}" ON "${table}" USING GIN (("data"->>'${key}') gin_trgm_ops)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const names = [
      'IDX_notify_archived_notifications_data_to_trgm',
      'IDX_notify_archived_notifications_data_from_trgm',
      'IDX_notify_archived_notifications_data_subject_trgm',
      'IDX_notify_notifications_data_to_trgm',
      'IDX_notify_notifications_data_from_trgm',
      'IDX_notify_notifications_data_subject_trgm',
    ];

    for (const name of names) {
      await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${name}"`);
    }
  }
}

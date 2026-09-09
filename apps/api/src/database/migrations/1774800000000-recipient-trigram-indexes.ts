import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Complete the trigram index coverage for the recipient filter.
 *
 * 1774000000100 added trigram indexes for data->>'subject'/'from'/'to' only.
 * NotificationDataFilterHelper's recipient predicate ORs across to/cc/bcc/target,
 * and a single unindexed arm forces the planner to abandon the BitmapOr and scan
 * the whole table — measured at ~71s over 1.46M archived rows even after the
 * predicate itself was simplified. Indexing the remaining three keys lets the
 * planner combine all four arms as a BitmapOr of GIN scans.
 *
 * Also drops IDX_ARCHIVED_DELIVERY_STATUS, which is byte-for-byte redundant with
 * IDX_notify_archived_notifications_delivery_status (same column, same type).
 * Carrying both costs insert/update throughput on a hot, write-heavy table for
 * no read benefit.
 *
 * CRITICAL: CREATE INDEX CONCURRENTLY cannot run inside a transaction. TypeORM
 * wraps migrations transactionally by default, so we set `transaction = false`.
 * This keeps the lock window minimal — these indexes are large on production
 * data and CONCURRENTLY avoids blocking writes during the build.
 */
export class RecipientTrigramIndexes1774800000000 implements MigrationInterface {
  public readonly transaction = false;

  private readonly indexes: Array<{ name: string; table: string; key: string }> = [
    {
      name: 'IDX_notify_notifications_data_cc_trgm',
      table: 'notify_notifications',
      key: 'cc',
    },
    {
      name: 'IDX_notify_notifications_data_bcc_trgm',
      table: 'notify_notifications',
      key: 'bcc',
    },
    {
      name: 'IDX_notify_notifications_data_target_trgm',
      table: 'notify_notifications',
      key: 'target',
    },
    {
      name: 'IDX_notify_archived_notifications_data_cc_trgm',
      table: 'notify_archived_notifications',
      key: 'cc',
    },
    {
      name: 'IDX_notify_archived_notifications_data_bcc_trgm',
      table: 'notify_archived_notifications',
      key: 'bcc',
    },
    {
      name: 'IDX_notify_archived_notifications_data_target_trgm',
      table: 'notify_archived_notifications',
      key: 'target',
    },
  ];

  private readonly redundantIndex = 'IDX_ARCHIVED_DELIVERY_STATUS';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { name, table, key } of this.indexes) {
      await queryRunner.query(
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${name}" ON "${table}" USING GIN (("data"->>'${key}') gin_trgm_ops)`,
      );
    }

    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${this.redundantIndex}"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${this.redundantIndex}" ON "notify_archived_notifications" ("delivery_status")`,
    );

    for (const { name } of [...this.indexes].reverse()) {
      await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${name}"`);
    }
  }
}

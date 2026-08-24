import { MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

/**
 * UQ_APP_CHAIN_NAME was a plain unique constraint on (application_id, chain_name), so it kept
 * blocking a name after the chain was soft-deleted (status flipped to INACTIVE, row retained) —
 * recreating a chain with that name failed with a raw DB error instead of a clean conflict.
 * Postgres unique constraints can't carry a WHERE clause, so this is replaced with a partial
 * unique index scoped to active rows (status = 1), which still blocks two active chains from
 * sharing a name but allows the name to be reused once the old chain is inactive.
 */
export class ScopeChainNameUniquenessToActive1774700000000 implements MigrationInterface {
  private readonly indexName = 'UQ_APP_CHAIN_NAME_ACTIVE';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('notify_provider_chains', 'UQ_APP_CHAIN_NAME');
    await queryRunner.query(`
      CREATE UNIQUE INDEX "${this.indexName}"
      ON notify_provider_chains (application_id, chain_name)
      WHERE status = 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "${this.indexName}"`);
    await queryRunner.createUniqueConstraint(
      'notify_provider_chains',
      new TableUnique({
        columnNames: ['application_id', 'chain_name'],
        name: 'UQ_APP_CHAIN_NAME',
      }),
    );
  }
}

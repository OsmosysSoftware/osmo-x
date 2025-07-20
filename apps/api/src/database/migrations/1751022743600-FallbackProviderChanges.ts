import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class FallbackProviderChanges1751022743600 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create notify_provider_chains table
    await queryRunner.createTable(
      new Table({
        name: 'notify_provider_chains',
        columns: [
          {
            name: 'chain_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'chain_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'application_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'provider_type',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_default',
            type: 'smallint',
            default: '0',
            isNullable: false,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            default: '1',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // 2. Create notify_provider_chain_members table
    await queryRunner.createTable(
      new Table({
        name: 'notify_provider_chain_members',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'chain_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'provider_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'priority_order',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'smallint',
            default: '1',
            isNullable: false,
          },
          {
            name: 'created_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            default: '1',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // 3. Add Foreign Key Constraints for notify_provider_chains
    await queryRunner.createForeignKey(
      'notify_provider_chains',
      new TableForeignKey({
        columnNames: ['application_id'],
        referencedColumnNames: ['application_id'],
        referencedTableName: 'notify_applications',
        onDelete: 'CASCADE',
        name: 'FK_PROVIDER_CHAINS_APPLICATION',
      }),
    );

    // 4. Add Foreign Key Constraints for notify_provider_chain_members
    await queryRunner.createForeignKey(
      'notify_provider_chain_members',
      new TableForeignKey({
        columnNames: ['chain_id'],
        referencedColumnNames: ['chain_id'],
        referencedTableName: 'notify_provider_chains',
        onDelete: 'CASCADE',
        name: 'FK_CHAIN_MEMBERS_CHAIN',
      }),
    );

    await queryRunner.createForeignKey(
      'notify_provider_chain_members',
      new TableForeignKey({
        columnNames: ['provider_id'],
        referencedColumnNames: ['provider_id'],
        referencedTableName: 'notify_providers',
        onDelete: 'CASCADE',
        name: 'FK_CHAIN_MEMBERS_PROVIDER',
      }),
    );

    // 5. Create Indexes for notify_provider_chains
    await queryRunner.createIndex(
      'notify_provider_chains',
      new TableIndex({
        columnNames: ['application_id', 'provider_type'],
        name: 'IDX_CHAINS_APPLICATION_CHANNEL',
      }),
    );

    await queryRunner.createIndex(
      'notify_provider_chains',
      new TableIndex({
        columnNames: ['status'],
        name: 'IDX_CHAINS_STATUS',
      }),
    );

    await queryRunner.createIndex(
      'notify_provider_chains',
      new TableIndex({
        columnNames: ['application_id', 'provider_type', 'is_default'],
        name: 'IDX_CHAINS_DEFAULT',
      }),
    );

    // 6. Create Indexes for notify_provider_chain_members
    await queryRunner.createIndex(
      'notify_provider_chain_members',
      new TableIndex({
        columnNames: ['chain_id', 'priority_order'],
        name: 'IDX_CHAIN_MEMBERS_CHAIN_ORDER',
      }),
    );

    await queryRunner.createIndex(
      'notify_provider_chain_members',
      new TableIndex({
        columnNames: ['provider_id'],
        name: 'IDX_CHAIN_MEMBERS_PROVIDER',
      }),
    );

    await queryRunner.createIndex(
      'notify_provider_chain_members',
      new TableIndex({
        columnNames: ['status'],
        name: 'IDX_CHAIN_MEMBERS_STATUS',
      }),
    );

    // 7. Add Unique Constraints for both tables
    await queryRunner.createUniqueConstraint(
      'notify_provider_chains',
      new TableUnique({
        columnNames: ['application_id', 'chain_name'],
        name: 'UQ_APP_CHAIN_NAME',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'notify_provider_chain_members',
      new TableUnique({
        columnNames: ['chain_id', 'priority_order'],
        name: 'UQ_CHAIN_PRIORITY',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'notify_provider_chain_members',
      new TableUnique({
        columnNames: ['chain_id', 'provider_id'],
        name: 'UQ_CHAIN_PROVIDER',
      }),
    );

    // 8. Table modifications for notify_notifications
    await queryRunner.addColumn(
      'notify_notifications',
      new TableColumn({
        name: 'provider_chain_id',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'notify_notifications',
      new TableForeignKey({
        columnNames: ['provider_chain_id'],
        referencedColumnNames: ['chain_id'],
        referencedTableName: 'notify_provider_chains',
        onDelete: 'SET NULL',
        name: 'FK_NOTIFICATIONS_PROVIDER_CHAIN',
      }),
    );

    await queryRunner.createIndex(
      'notify_notifications',
      new TableIndex({
        columnNames: ['provider_chain_id'],
        name: 'IDX_NOTIFICATIONS_PROVIDER_CHAIN',
      }),
    );

    // 9. Table modifications for notify_archived_notifications
    await queryRunner.addColumn(
      'notify_archived_notifications',
      new TableColumn({
        name: 'provider_chain_id',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'notify_archived_notifications',
      new TableForeignKey({
        columnNames: ['provider_chain_id'],
        referencedColumnNames: ['chain_id'],
        referencedTableName: 'notify_provider_chains',
        onDelete: 'SET NULL',
        name: 'FK_ARCHIVED_NOTIFICATIONS_PROVIDER_CHAIN',
      }),
    );

    await queryRunner.createIndex(
      'notify_archived_notifications',
      new TableIndex({
        columnNames: ['provider_chain_id'],
        name: 'IDX_ARCHIVED_NOTIFICATIONS_PROVIDER_CHAIN',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Revert changes from table notify_archived_notifications
    await queryRunner.dropIndex(
      'notify_archived_notifications',
      'IDX_ARCHIVED_NOTIFICATIONS_PROVIDER_CHAIN',
    );
    await queryRunner.dropForeignKey(
      'notify_archived_notifications',
      'FK_ARCHIVED_NOTIFICATIONS_PROVIDER_CHAIN',
    );
    await queryRunner.dropColumn('notify_archived_notifications', 'provider_chain_id');

    // 2. Revert changes from table notify_notifications
    await queryRunner.dropIndex('notify_notifications', 'IDX_NOTIFICATIONS_PROVIDER_CHAIN');
    await queryRunner.dropForeignKey('notify_notifications', 'FK_NOTIFICATIONS_PROVIDER_CHAIN');
    await queryRunner.dropColumn('notify_notifications', 'provider_chain_id');

    // 3. Drop Unique Constraints
    await queryRunner.dropUniqueConstraint('notify_provider_chain_members', 'UQ_CHAIN_PROVIDER');
    await queryRunner.dropUniqueConstraint('notify_provider_chain_members', 'UQ_CHAIN_PRIORITY');
    await queryRunner.dropUniqueConstraint('notify_provider_chains', 'UQ_APP_CHAIN_NAME');

    // 4. Drop Indexes
    await queryRunner.dropIndex('notify_provider_chain_members', 'IDX_CHAIN_MEMBERS_STATUS');
    await queryRunner.dropIndex('notify_provider_chain_members', 'IDX_CHAIN_MEMBERS_PROVIDER');
    await queryRunner.dropIndex('notify_provider_chain_members', 'IDX_CHAIN_MEMBERS_CHAIN_ORDER');

    await queryRunner.dropIndex('notify_provider_chains', 'IDX_CHAINS_DEFAULT');
    await queryRunner.dropIndex('notify_provider_chains', 'IDX_CHAINS_STATUS');
    await queryRunner.dropIndex('notify_provider_chains', 'IDX_CHAINS_APPLICATION_CHANNEL');

    // 5. Drop Foreign Key Constraints
    await queryRunner.dropForeignKey('notify_provider_chain_members', 'FK_CHAIN_MEMBERS_PROVIDER');
    await queryRunner.dropForeignKey('notify_provider_chain_members', 'FK_CHAIN_MEMBERS_CHAIN');
    await queryRunner.dropForeignKey('notify_provider_chains', 'FK_PROVIDER_CHAINS_APPLICATION');

    // 6. Drop tables in reverse order of creation to respect dependencies
    await queryRunner.dropTable('notify_provider_chain_members');
    await queryRunner.dropTable('notify_provider_chains');
  }
}

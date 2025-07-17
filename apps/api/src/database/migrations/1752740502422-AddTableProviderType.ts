import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddTableProviderTypes1752740502422 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create notify_provider_types table
    await queryRunner.createTable(
      new Table({
        name: 'notify_provider_types',
        columns: [
          {
            name: 'provider_type_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
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
            isNullable: false,
          },
          {
            name: 'status',
            type: 'smallint',
            isNullable: false,
            default: 1,
          },
        ],
      }),
      true,
    );

    // 2. Seed Data
    const providerTypesData = [
      {
        name: 'Email',
        description: 'Provider type: Email',
      },
      {
        name: 'SMS',
        description: 'Provider type: SMS',
      },
      {
        name: 'WhatsApp Business Template',
        description: 'Provider type: WhatsApp Business Template',
      },
      {
        name: 'Push Notification',
        description: 'Provider type: Push Notification',
      },
      {
        name: 'Voice Call',
        description: 'Provider type: Voice Call',
      },
      {
        name: 'WhatsApp Direct',
        description: 'Provider type: WhatsApp Direct',
      },
    ];

    for (const typeData of providerTypesData) {
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into('notify_provider_types')
        .values(typeData)
        .execute();
    }

    // 3. Update provider_type for WA_TWILIO in notify_master_providers
    await queryRunner.query(`
      UPDATE notify_master_providers
      SET provider_type = (
        SELECT provider_type_id
        FROM notify_provider_types
        WHERE name = 'WhatsApp Direct'
      )
      WHERE name = 'WA_TWILIO';
    `);

    // 4. Add Foreign Key Constraints for notify_master_providers
    await queryRunner.createForeignKey(
      'notify_master_providers',
      new TableForeignKey({
        columnNames: ['provider_type'],
        referencedColumnNames: ['provider_type_id'],
        referencedTableName: 'notify_provider_types',
        onDelete: 'SET NULL',
        name: 'FK_MASTER_PROVIDERS_PROVIDER_TYPE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Revert changes from notify_master_providers
    await queryRunner.dropForeignKey(
      'notify_master_providers',
      'FK_MASTER_PROVIDERS_PROVIDER_TYPE',
    );

    await queryRunner.query(`
      UPDATE notify_master_providers
      SET provider_type = 3
      WHERE name = 'WA_TWILIO';
    `);

    // 2. Drop table notify_provider_types
    await queryRunner.dropTable('notify_provider_types');
  }
}

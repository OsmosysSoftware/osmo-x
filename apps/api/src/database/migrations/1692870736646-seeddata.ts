import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class SeedData1692870736646 implements MigrationInterface {
  name = 'SeedData1692870736646';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO notify_users (username,password,role) VALUES (?, ?, ?)`, [
      'Admin',
      // Admin123
      '$2b$10$iUUsgPtfqu./C2fnnb80EOlNxc3q73woJd2.Ns0D66xHh0iX4E1vq',
      1,
    ]);

    await queryRunner.query(`INSERT INTO notify_applications (name,user_id) VALUES (?, ?)`, [
      'sampleOsmoXApp',
      1,
    ]);

    await queryRunner.query(
      `INSERT INTO notify_server_api_keys (api_key,application_id) VALUES (?, ?)`,
      ['OsmoX-test-key', 1],
    );

    // notify_master_providers data
    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration) VALUES (?, ?, ?)`,
      [
        'SMTP',
        1,
        '{"SMTP_HOST":{"label":"SMTP HOST","id":"SMTP_HOST","pattern":"^(https?|ftp)://[^\\s/$.?#].[^\\s]*$","type":"string"},"SMTP_PORT":{"label":"SMTP PORT","id":"SMTP_PORT","pattern":"\\d{1,5}","type":"number"},"SMTP_USERNAME":{"label":"SMTP USERNAME","id":"SMTP_USERNAME","pattern":"^[a-zA-Z0-9_-]{3,30}$","type":"string"},"SMTP_PASSWORD":{"label":"SMTP PASSWORD","id":"SMTP_PASSWORD","pattern":"^\\$2[ayb]\\$.{56}$","type":"string"}}',
      ],
    );

    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration) VALUES (?, ?, ?)`,
      [
        'MAILGUN',
        1,
        '{"MAILGUN_API_KEY":{"label":"MAILGUN API KEY","id":"MAILGUN_API_KEY","pattern":"^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$","type":"string"},"MAILGUN_HOST":{"label":"MAILGUN HOST","id":"MAILGUN_HOST","pattern":"^(https?|ftp)://[^\\s/$.?#].[^\\s]*$","type":"string"},"MAILGUN_DOMAIN":{"label":"MAILGUN DOMAIN","id":"MAILGUN_DOMAIN","pattern":"^([a-z0-9]+(-[a-z0-9]+)*\\.)+[a-z]{2,}$","type":"string"}}',
      ],
    );

    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration) VALUES (?, ?, ?)`,
      [
        'WA_360_DAILOG',
        3,
        '{"WA_360_DIALOG_URL":{"label":"WA 360 DIALOG URL","id":"WA_360_DIALOG_URL","pattern":"^https://waba.360dialog.io/v1/messages$","type":"string"},"WA_360_DIALOG_API_KEY":{"label":"WA 360 DIALOG API KEY","id":"WA_360_DIALOG_API_KEY","pattern":"^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$","type":"string"}}',
      ],
    );

    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration) VALUES (?, ?, ?)`,
      [
        'WA_TWILIO',
        3,
        '{"TWILIO_WA_ACCOUNT_SID":{"label":"TWILIO WA ACCOUNT SID","id":"TWILIO_WA_ACCOUNT_SID","pattern":"^AC\\w{3,}$","type":"string"},"TWILIO_WA_AUTH_TOKEN":{"label":"TWILIO WA AUTH TOKEN","id":"TWILIO_WA_AUTH_TOKEN","pattern":"^[a-zA-Z0-9-_]{16,512}$","type":"string"},"TWILIO_WA_NUMBER":{"label":"TWILIO WA NUMBER","id":"TWILIO_WA_NUMBER","pattern":"^\\+[1-9]\\d{6,14}$","type":"string"}}',
      ],
    );

    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration) VALUES (?, ?, ?)`,
      [
        'SMS_TWILIO',
        2,
        '{"TWILIO_SMS_ACCOUNT_SID":{"label":"TWILIO SMS ACCOUNT SID","id":"TWILIO_SMS_ACCOUNT_SID","pattern":"^AC\\w{3,}$","type":"string"},"TWILIO_SMS_AUTH_TOKEN":{"label":"TWILIO SMS AUTH TOKEN","id":"TWILIO_SMS_AUTH_TOKEN","pattern":"^[a-zA-Z0-9-_]{16,512}$","type":"string"},"TWILIO_SMS_NUMBER":{"label":"TWILIO SMS NUMBER","id":"TWILIO_SMS_NUMBER","pattern":"^\\+[1-9]\\d{6,14}$","type":"string"}}',
      ],
    );

    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration) VALUES (?, ?, ?)`,
      [
        'SMS_PLIVO',
        2,
        '{"PLIVO_SMS_AUTH_ID":{"label":"PLIVO SMS AUTH ID","id":"PLIVO_SMS_AUTH_ID","pattern":"^AC\\w{3,}$","type":"string"},"PLIVO_SMS_AUTH_TOKEN":{"label":"PLIVO SMS AUTH TOKEN","id":"PLIVO_SMS_AUTH_TOKEN","pattern":"^[a-zA-Z0-9-_]{16,512}$","type":"string"},"PLIVO_SMS_NUMBER":{"label":"PLIVO SMS NUMBER","id":"PLIVO_SMS_NUMBER","pattern":"^\\+[1-9]\\d{6,14}$","type":"string"}}',
      ],
    );

    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration) VALUES (?, ?, ?)`,
      [
        'WA_TWILIO_BUSINESS',
        3,
        '{"TWILIO_WA_ACCOUNT_SID":{"label":"TWILIO WA ACCOUNT SID","id":"TWILIO_WA_ACCOUNT_SID","pattern":"^AC\\w{3,}$","type":"string"},"TWILIO_WA_AUTH_TOKEN":{"label":"TWILIO WA AUTH TOKEN","id":"TWILIO_WA_AUTH_TOKEN","pattern":"^[a-zA-Z0-9-_]{16,512}$","type":"string"}}',
      ],
    );

    // Add foreign key for channel_type -> master_id
    // Adding this after seeding data in master_providers so FK constraint does not fail
    await queryRunner.createForeignKey(
      'notify_notifications',
      new TableForeignKey({
        columnNames: ['channel_type'],
        referencedColumnNames: ['master_id'],
        referencedTableName: 'notify_master_providers',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // To drop the auto generated foreign key for notify_notifications
    const table = await queryRunner.getTable('notify_notifications');

    // Find the foreign key based on the column it references
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('channel_type') !== -1,
    );

    // If the foreign key exists, drop it
    if (foreignKey) {
      await queryRunner.dropForeignKey('notify_notifications', foreignKey);
    }

    // Queries for deleting records from notify_master_providers
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE name = 'WA_TWILIO_BUSINESS' AND provider_type = 3;
    `);
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE name = 'SMS_PLIVO' AND provider_type = 2;
    `);
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE name = 'SMS_TWILIO' AND provider_type = 2;
    `);
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE name = 'WA_TWILIO' AND provider_type = 3;
    `);
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE name = 'WA_360_DAILOG' AND provider_type = 3;
    `);
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE name = 'MAILGUN' AND provider_type = 1;
    `);
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE name = 'SMTP' AND provider_type = 1;
    `);

    // Queries for deleting records from other tables
    await queryRunner.query(`
      DELETE FROM notify_server_api_keys
      WHERE api_key = 'OsmoX-test-key' AND application_id = 1;
    `);
    await queryRunner.query(`
      DELETE FROM notify_applications
      WHERE name = 'sampleOsmoXApp' AND user_id = 1;
    `);
    await queryRunner.query(`
      DELETE FROM notify_users
      WHERE username = 'Admin' AND role = 1;
    `);
  }
}

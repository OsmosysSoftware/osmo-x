import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedData1692870736646 implements MigrationInterface {
  name = 'SeedData1692870736646';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert sample data into a table
    await queryRunner.query(
      `INSERT INTO notify_users (username,password,role,created_on,updated_on,status) VALUES ('Admin','$2b$10$iUUsgPtfqu./C2fnnb80EOlNxc3q73woJd2.Ns0D66xHh0iX4E1vq',1,'2024-04-19 13:01:11','2024-04-19 15:37:16',1)`,
    );

    await queryRunner.query(
      `INSERT INTO notify_applications (application_id,name,user_id,created_on,updated_on,status) VALUES (1001,'sampleOsmoXApp',1,'2024-04-12 11:36:02','2024-04-12 11:36:02',1)`,
    );

    await queryRunner.query(
      `INSERT INTO notify_server_api_keys (api_key,application_id,created_on,updated_on,status) VALUES ('OsmoX-test-key',1001,'2024-04-12 12:28:06','2024-04-12 12:28:06',1)`,
    );

    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration,created_on,updated_on,status) VALUES ('SMTP',1,'{"ENABLE_SMTP":{"label":"ENABLE SMTP","id":"ENABLE_SMTP","pattern":"/^(true|false)$/","type":"boolean"},"SMTP_HOST":{"label":"SMTP HOST","id":"SMTP_HOST","pattern":"^https?://(?:[^/]+|(?:\\d{1,3}\\.){3}\\d{1,3})/","type":"string"},"SMTP_PORT":{"label":"SMTP PORT","id":"SMTP_PORT","pattern":"\\d{1,5}","type":"number"},"SMTP_USERNAME":{"label":"SMTP USERNAME","id":"SMTP_USERNAME","pattern":"^[a-zA-Z0-9_-]{3,16}$","type":"string"},"SMTP_PASSWORD":{"label":"SMTP PASSWORD","id":"SMTP_PASSWORD","pattern":"^[a-fA-F0-9]{64}$","type":"string"}}','2024-04-24 15:20:23','2024-04-24 15:20:23',1),

      ('MAILGUN',1,'{"ENABLE_MAILGUN":{"label":"ENABLE MAILGUN","id":"ENABLE_MAILGUN","pattern":"/^(true|false)$/","type":"boolean"},"MAILGUN_API_KEY":{"label":"MAILGUN API KEY","id":"MAILGUN_API_KEY","pattern":"^[a-zA-Z0-9-_]{16,512}$","type":"string"},"MAILGUN_HOST":{"label":"MAILGUN HOST","id":"MAILGUN_HOST","pattern":"^https?://(?:[^/]+|(?:\\d{1,3}\\.){3}\\d{1,3})/","type":"string"},"MAILGUN_DOMAIN":{"label":"MAILGUN DOMAIN","id":"MAILGUN_DOMAIN","pattern":"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$","type":"string"}}','2024-04-24 15:26:10','2024-04-24 15:26:10',1),

      ('WA_360_DAILOG',3,'{"ENABLE_WA360DIALOG":{"label":"ENABLE WA360DIALOG","id":"ENABLE_WA360DIALOG","pattern":"/^(true|false)$/","type":"boolean"},"WA_360_DIALOG_URL":{"label":"MAILGUN API KEY","id":"MAILGUN_API_KEY","pattern":"^{https://waba.360dialog.io/v1/messages}$","type":"string"},"WA_360_DIALOG_API_KEY":{"label":"WA 360 DIALOG API KEY","id":"WA_360_DIALOG_API_KEY","pattern":"^[a-zA-Z0-9-_]{16,512}$","type":"string"}}','2024-04-24 15:31:54','2024-04-24 15:31:54',1),

      ('WA_TWILIO',3,'{"ENABLE_WA_TWILIO":{"label":"ENABLE WA TWILIO","id":"ENABLE_WA_TWILIO","pattern":"/^(true|false)$/","type":"boolean"},"TWILIO_WA_ACCOUNT_SID":{"label":"TWILIO WA ACCOUNT SID","id":"TWILIO_WA_ACCOUNT_SID","pattern":"^AC\\w{3,}$","type":"string"},"TWILIO_WA_AUTH_TOKEN":{"label":"TWILIO WA AUTH TOKEN","id":"TWILIO_WA_AUTH_TOKEN","pattern":"^[a-zA-Z0-9-_]{16,512}$","type":"string"},"TWILIO_WA_NUMBER":{"label":"TWILIO WA NUMBER","id":"TWILIO_WA_NUMBER","pattern":"^\\d{10}$","type":"string"}}','2024-04-24 15:36:46','2024-04-24 15:36:46',1),

      ('SMS_TWILIO',2,'{"ENABLE_SMS_TWILIO":{"label":"ENABLE SMS TWILIO","id":"ENABLE_SMS_TWILIO","pattern":"/^(true|false)$/","type":"boolean"},"TWILIO_SMS_ACCOUNT_SID":{"label":"TWILIO SMS ACCOUNT SID","id":"TWILIO_SMS_ACCOUNT_SID","pattern":"^AC\\w{3,}$","type":"string"},"TWILIO_SMS_AUTH_TOKEN":{"label":"TWILIO SMS AUTH TOKEN","id":"TWILIO_SMS_AUTH_TOKEN","pattern":"^[a-zA-Z0-9-_]{16,512}$","type":"string"},"TWILIO_SMS_NUMBER":{"label":"TWILIO SMS NUMBER","id":"TWILIO_SMS_NUMBER","pattern":"^\\d{10}$","type":"string"}}','2024-04-24 15:42:15','2024-04-24 15:42:15',1);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE id IN (1, 2, 3, 4, 5);
    `);
    await queryRunner.query(`
      DELETE FROM notify_server_api_keys
      WHERE id IN (1);
    `);
    await queryRunner.query(`
      DELETE FROM notify_applications
      WHERE id IN (1);
    `);
    await queryRunner.query(`
      DELETE FROM notify_users
      WHERE id IN (1);
    `);
  }
}

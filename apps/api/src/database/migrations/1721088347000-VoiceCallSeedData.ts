import { MigrationInterface, QueryRunner } from 'typeorm';

export class VoiceCallTwilioData1721088347000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO notify_master_providers (name,provider_type,configuration) VALUES (?, ?, ?)`,
      [
        'VC_TWILIO',
        5,
        '{"TWILIO_VC_ACCOUNT_SID":{"label":"TWILIO VC ACCOUNT SID","id":"TWILIO_VC_ACCOUNT_SID","pattern":"^AC\\w{3,}$","type":"string"},"TWILIO_VC_AUTH_TOKEN":{"label":"TWILIO VC AUTH TOKEN","id":"TWILIO_VC_AUTH_TOKEN","pattern":"^[a-zA-Z0-9-_]{16,512}$","type":"string"}}',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM notify_master_providers
      WHERE name = 'VC_TWILIO' AND provider_type = 5;
    `);
  }
}

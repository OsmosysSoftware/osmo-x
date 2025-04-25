import { MigrationInterface, QueryRunner } from 'typeorm';

interface MasterProviderConfiguration {
  name: string;
  provider_type: number;
  configuration: object;
}

export class InitialSeed1745495895857 implements MigrationInterface {
  name = 'InitialSeed1745495895857';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed Data START ---------------------------------------------------------
    // Seed Admin User
    const usersData = [
      {
        username: 'Admin',
        // Admin123
        password: '$2b$10$iUUsgPtfqu./C2fnnb80EOlNxc3q73woJd2.Ns0D66xHh0iX4E1vq',
        role: 1,
        status: 1,
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('notify_users')
      .values(usersData)
      .execute();

    // Seed Master Providers
    const masterProvidersData: MasterProviderConfiguration[] = [
      {
        name: 'SMTP',
        provider_type: 1,
        configuration: {
          SMTP_HOST: {
            label: 'SMTP HOST',
            id: 'SMTP_HOST',
            pattern: '^(https?|ftp)://[^\\s/$.?#].[^\\s]*$',
            type: 'string',
          },
          SMTP_PORT: { label: 'SMTP PORT', id: 'SMTP_PORT', pattern: '\\d{1,5}', type: 'number' },
          SMTP_USERNAME: {
            label: 'SMTP USERNAME',
            id: 'SMTP_USERNAME',
            pattern: '^[a-zA-Z0-9_-]{3,30}$',
            type: 'string',
          },
          SMTP_PASSWORD: {
            label: 'SMTP PASSWORD',
            id: 'SMTP_PASSWORD',
            pattern: '^\\$2[ayb]\\$.{56}$',
            type: 'string',
          },
        },
      },
      {
        name: 'MAILGUN',
        provider_type: 1,
        configuration: {
          MAILGUN_API_KEY: {
            label: 'MAILGUN API KEY',
            id: 'MAILGUN_API_KEY',
            pattern: '^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$',
            type: 'string',
          },
          MAILGUN_HOST: {
            label: 'MAILGUN HOST',
            id: 'MAILGUN_HOST',
            pattern: '^(https?|ftp)://[^\\s/$.?#].[^\\s]*$',
            type: 'string',
          },
          MAILGUN_DOMAIN: {
            label: 'MAILGUN DOMAIN',
            id: 'MAILGUN_DOMAIN',
            pattern: '^([a-z0-9]+(-[a-z0-9]+)*\\.)+[a-z]{2,}$',
            type: 'string',
          },
        },
      },
      {
        name: 'WA_360_DIALOG',
        provider_type: 3,
        configuration: {
          WA_360_DIALOG_URL: {
            label: 'WA 360 DIALOG URL',
            id: 'WA_360_DIALOG_URL',
            pattern: '^https://waba.360dialog.io/v1/messages$',
            type: 'string',
          },
          WA_360_DIALOG_API_KEY: {
            label: 'WA 360 DIALOG API KEY',
            id: 'WA_360_DIALOG_API_KEY',
            pattern: '^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$',
            type: 'string',
          },
        },
      },
      {
        name: 'WA_TWILIO',
        provider_type: 3,
        configuration: {
          TWILIO_WA_ACCOUNT_SID: {
            label: 'TWILIO WA ACCOUNT SID',
            id: 'TWILIO_WA_ACCOUNT_SID',
            pattern: '^AC\\w{3,}$',
            type: 'string',
          },
          TWILIO_WA_AUTH_TOKEN: {
            label: 'TWILIO WA AUTH TOKEN',
            id: 'TWILIO_WA_AUTH_TOKEN',
            pattern: '^[a-zA-Z0-9-_]{16,512}$',
            type: 'string',
          },
          TWILIO_WA_NUMBER: {
            label: 'TWILIO WA NUMBER',
            id: 'TWILIO_WA_NUMBER',
            pattern: '^\\+[1-9]\\d{6,14}$',
            type: 'string',
          },
        },
      },
      {
        name: 'SMS_TWILIO',
        provider_type: 2,
        configuration: {
          TWILIO_SMS_ACCOUNT_SID: {
            label: 'TWILIO SMS ACCOUNT SID',
            id: 'TWILIO_SMS_ACCOUNT_SID',
            pattern: '^AC\\w{3,}$',
            type: 'string',
          },
          TWILIO_SMS_AUTH_TOKEN: {
            label: 'TWILIO SMS AUTH TOKEN',
            id: 'TWILIO_SMS_AUTH_TOKEN',
            pattern: '^[a-zA-Z0-9-_]{16,512}$',
            type: 'string',
          },
          TWILIO_SMS_NUMBER: {
            label: 'TWILIO SMS NUMBER',
            id: 'TWILIO_SMS_NUMBER',
            pattern: '^\\+[1-9]\\d{6,14}$',
            type: 'string',
          },
        },
      },
      {
        name: 'SMS_PLIVO',
        provider_type: 2,
        configuration: {
          PLIVO_SMS_AUTH_ID: {
            label: 'PLIVO SMS AUTH ID',
            id: 'PLIVO_SMS_AUTH_ID',
            pattern: '^AC\\w{3,}$',
            type: 'string',
          },
          PLIVO_SMS_AUTH_TOKEN: {
            label: 'PLIVO SMS AUTH TOKEN',
            id: 'PLIVO_SMS_AUTH_TOKEN',
            pattern: '^[a-zA-Z0-9-_]{16,512}$',
            type: 'string',
          },
          PLIVO_SMS_NUMBER: {
            label: 'PLIVO SMS NUMBER',
            id: 'PLIVO_SMS_NUMBER',
            pattern: '^\\+[1-9]\\d{6,14}$',
            type: 'string',
          },
        },
      },
      {
        name: 'WA_TWILIO_BUSINESS',
        provider_type: 3,
        configuration: {
          TWILIO_WA_ACCOUNT_SID: {
            label: 'TWILIO WA ACCOUNT SID',
            id: 'TWILIO_WA_ACCOUNT_SID',
            pattern: '^AC\\w{3,}$',
            type: 'string',
          },
          TWILIO_WA_AUTH_TOKEN: {
            label: 'TWILIO WA AUTH TOKEN',
            id: 'TWILIO_WA_AUTH_TOKEN',
            pattern: '^[a-zA-Z0-9-_]{16,512}$',
            type: 'string',
          },
        },
      },
      {
        name: 'SMS_KAPSYSTEM',
        provider_type: 2,
        configuration: {
          KAP_SMS_BASE_API_URL: {
            label: 'KAP SMS BASE API URL',
            id: 'KAP_SMS_BASE_API_URL',
            pattern: '^https?://[^(\\?\\s)]+$',
            type: 'string',
          },
          KAP_SMS_ACCOUNT_USERNAME: {
            label: 'KAP SMS ACCOUNT USERNAME',
            id: 'KAP_SMS_ACCOUNT_USERNAME',
            pattern: '^[a-zA-Z0-9_-]{3,30}$',
            type: 'string',
          },
          KAP_SMS_ACCOUNT_PASSWORD: {
            label: 'KAP SMS ACCOUNT PASSWORD',
            id: 'KAP_SMS_ACCOUNT_PASSWORD',
            pattern: '^[a-zA-Z0-9_-]{3,30}$',
            type: 'string',
          },
          KAP_SMS_FROM: {
            label: 'KAP SMS FROM',
            id: 'KAP_SMS_FROM',
            pattern: '^[a-zA-Z]{6}$',
            type: 'string',
          },
        },
      },
      {
        name: 'PUSH_SNS',
        provider_type: 4,
        configuration: {
          AWS_ACCESS_KEY_ID: {
            label: 'AWS ACCESS KEY ID',
            id: 'AWS_ACCESS_KEY_ID',
            pattern: '^[A-Z0-9]{20}$',
            type: 'string',
          },
          AWS_SECRET_ACCESS_KEY: {
            label: 'AWS SECRET ACCESS KEY',
            id: 'AWS_SECRET_ACCESS_KEY',
            pattern: '^[A-Za-z0-9/+=]{40}$',
            type: 'string',
          },
          AWS_REGION: {
            label: 'AWS REGION',
            id: 'AWS_REGION',
            pattern: '^[a-z]{2}-[a-z]+-\\d$',
            type: 'string',
          },
        },
      },
      {
        name: 'VC_TWILIO',
        provider_type: 5,
        configuration: {
          TWILIO_VC_ACCOUNT_SID: {
            label: 'TWILIO VC ACCOUNT SID',
            id: 'TWILIO_VC_ACCOUNT_SID',
            pattern: '^AC\\w{3,}$',
            type: 'string',
          },
          TWILIO_VC_AUTH_TOKEN: {
            label: 'TWILIO VC AUTH TOKEN',
            id: 'TWILIO_VC_AUTH_TOKEN',
            pattern: '^[a-zA-Z0-9-_]{16,512}$',
            type: 'string',
          },
        },
      },
      {
        name: 'AWS_SES',
        provider_type: 1,
        configuration: {
          AWS_ACCESS_KEY_ID: {
            label: 'AWS ACCESS KEY ID',
            id: 'AWS_ACCESS_KEY_ID',
            pattern: '^[A-Z0-9]{20}$',
            type: 'string',
          },
          AWS_SECRET_ACCESS_KEY: {
            label: 'AWS SECRET ACCESS KEY',
            id: 'AWS_SECRET_ACCESS_KEY',
            pattern: '^[A-Za-z0-9/+=]{40}$',
            type: 'string',
          },
          AWS_REGION: {
            label: 'AWS REGION',
            id: 'AWS_REGION',
            pattern: '^[a-z]{2}-[a-z]+-\\d$',
            type: 'string',
          },
        },
      },
      {
        name: 'SMS_SNS',
        provider_type: 4,
        configuration: {
          AWS_ACCESS_KEY_ID: {
            label: 'AWS ACCESS KEY ID',
            id: 'AWS_ACCESS_KEY_ID',
            pattern: '^[A-Z0-9]{20}$',
            type: 'string',
          },
          AWS_SECRET_ACCESS_KEY: {
            label: 'AWS SECRET ACCESS KEY',
            id: 'AWS_SECRET_ACCESS_KEY',
            pattern: '^[A-Za-z0-9/+=]{40}$',
            type: 'string',
          },
          AWS_REGION: {
            label: 'AWS REGION',
            id: 'AWS_REGION',
            pattern: '^[a-z]{2}-[a-z]+-\\d$',
            type: 'string',
          },
        },
      },
    ];

    try {
      for (const providerData of masterProvidersData) {
        try {
          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into('notify_master_providers')
            .values(providerData)
            .execute();
        } catch (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      throw error;
    }
    // Seed Data END -----------------------------------------------------------
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete seeded data in reverse order or by specific criteria if needed
    await queryRunner.query(`TRUNCATE TABLE "notify_master_providers" RESTART IDENTITY CASCADE`);
    await queryRunner.query(`DELETE FROM "notify_users" WHERE "username" = 'Admin'`);
  }
}

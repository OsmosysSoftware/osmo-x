---
name: add-provider
description: Add a new notification provider (email, SMS, WhatsApp, push, voice) to the OsmoX API with service, consumer, queue wiring, and master provider seed.
---

# Add Notification Provider

Add a new notification provider `$ARGUMENTS` to the OsmoX API.

## Step 1: Gather Requirements

Ask the user the following questions using `AskUserQuestion`:

**Q1 — Provider name and channel type:**
- Provider name (kebab-case, e.g., `mailgun`, `sms-twilio`, `wa-twilio-business`)
- Channel type: Email (1), SMS (2), WhatsApp Business (3), Push (4), Voice (5), WhatsApp Direct (6), or new type

**Q2 — SDK / transport library:**
- Which npm package does this provider use? (e.g., `nodemailer`, `@mailgun/mailgun.js`, `twilio`)
- If no package needed (raw HTTP calls), note that

**Q3 — Configuration fields:**
- What credentials/settings does this provider need? List as:
  > `FIELD_NAME: "description" (type: string|number, pattern: "regex")`
  > Example: `API_KEY: "Provider API key" (type: string, pattern: "^.{10,}$")`

**Q4 — Delivery confirmation:**
- **Skip confirmation** — provider sends and immediately succeeds (like SMTP)
- **Requires confirmation** — provider returns a message ID; a second call checks delivery status (like Mailgun, Twilio)

**Q5 — Notification data shape:**
- What fields does the notification `data` object contain? (e.g., `to`, `from`, `subject`, `body`, `html`)
- This determines the data type used in the consumer

## Step 2: Read Reference Files

Read these files to match exact patterns:

### Provider implementation reference (pick one matching the channel type):
- **Email:** `apps/api/src/modules/providers/smtp/smtp.service.ts` and `smtp.module.ts`
- **SMS:** `apps/api/src/modules/providers/sms-twilio/sms-twilio.service.ts`
- **WhatsApp:** `apps/api/src/modules/providers/wa-twilio/wa-twilio.service.ts`

### Consumer reference:
- `apps/api/src/jobs/consumers/notifications/smtp-notifications.job.consumer.ts` (skip confirmation)
- `apps/api/src/jobs/consumers/notifications/mailgun-notifications.job.consumer.ts` (with confirmation)

### Wiring files (always read these):
- `apps/api/src/modules/notifications/notifications.module.ts`
- `apps/api/src/modules/notifications/queues/queue.service.ts`
- `apps/api/src/common/constants/notifications.ts`
- `apps/api/src/database/migrations/1745495895857-InitialSeed.ts` (master providers seed)

## Step 3: Install Dependencies

If the provider requires an npm package:

```bash
cd apps/api && npm install <package-name>
```

## Step 4: Create Provider Files

### 4a. Provider Service

Create `apps/api/src/modules/providers/<provider-name>/<provider-name>.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ProvidersService } from '../providers.service';

@Injectable()
export class <ProviderName>Service {
  private <clientVar>; // SDK client instance

  constructor(
    private readonly providersService: ProvidersService,
    private logger: Logger = new Logger(<ProviderName>Service.name),
  ) {}

  async assignTransport(providerId: number): Promise<void> {
    this.logger.debug('Assigning transport for <ProviderName>');
    const config = await this.providersService.getConfigById(providerId);
    // Initialize SDK client with config values
    // e.g., this.<clientVar> = new Client({ apiKey: config.API_KEY });
  }

  async sendMessage(notificationData: <DataType>, providerId: number): Promise<unknown> {
    await this.assignTransport(providerId);
    this.logger.debug('Sending <ProviderName> notification');
    // Call SDK send method
    // return result;
  }

  // Only if provider requires delivery confirmation:
  async getDeliveryStatus(messageId: string, providerId: number): Promise<unknown> {
    await this.assignTransport(providerId);
    this.logger.debug('Fetching delivery status from <ProviderName>');
    // Call SDK status method
    // return status;
  }
}
```

### 4b. Provider Module

Create `apps/api/src/modules/providers/<provider-name>/<provider-name>.module.ts`:

```typescript
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { <ProviderName>Service } from './<provider-name>.service';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [<ProviderName>Service, ProvidersService, Logger],
  exports: [<ProviderName>Service],
})
export class <ProviderName>Module {}
```

## Step 5: Create Consumer

Create `apps/api/src/jobs/consumers/notifications/<provider-name>-notifications.job.consumer.ts`:

```typescript
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotificationConsumer } from './notification.consumer';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { RetryNotification } from 'src/modules/notifications/entities/retry-notification.entity';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { NotificationQueueProducer } from 'src/jobs/producers/notifications/notifications.job.producer';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { ProviderChainMembersService } from 'src/modules/provider-chain-members/provider-chain-members.service';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { <ProviderName>Service } from 'src/modules/providers/<provider-name>/<provider-name>.service';

@Injectable()
export class <ProviderName>NotificationConsumer extends NotificationConsumer {
  constructor(
    @InjectRepository(Notification)
    protected readonly notificationRepository: Repository<Notification>,
    @InjectRepository(RetryNotification)
    protected readonly notificationRetryRepository: Repository<RetryNotification>,
    private readonly <providerCamelCase>Service: <ProviderName>Service,
    @Inject(forwardRef(() => NotificationsService))
    notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationQueueProducer))
    notificationsQueueService: NotificationQueueProducer,
    webhookService: WebhookService,
    configService: ConfigService,
    providerChainMembersService: ProviderChainMembersService,
    providersService: ProvidersService,
  ) {
    super(
      notificationRepository,
      notificationRetryRepository,
      notificationsService,
      notificationsQueueService,
      webhookService,
      configService,
      providerChainMembersService,
      providersService,
    );
  }

  async process<ProviderName>NotificationQueue(id: number): Promise<void> {
    return super.processNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];

      return this.<providerCamelCase>Service.sendMessage(
        notification.data as <DataType>,
        notification.providerId,
      );
    });
  }

  // Only if provider requires delivery confirmation:
  async process<ProviderName>NotificationConfirmationQueue(id: number): Promise<void> {
    return super.processAwaitingConfirmationNotificationQueue(id, async () => {
      const notification = (await this.notificationsService.getNotificationById(id))[0];
      const sendResult = notification.result.result as <SendResultType>;
      const status = await this.<providerCamelCase>Service.getDeliveryStatus(
        sendResult.<messageIdField>,
        notification.providerId,
      );
      // Map provider status to DeliveryStatus enum
      // Return { result, deliveryStatus }
    });
  }
}
```

## Step 6: Wire into Existing Files

### 6a. Notifications Module (`notifications.module.ts`)

Add three things:
1. Import the provider module
2. Import the consumer class
3. Add module to `providerModules` array and consumer to `consumers` array

### 6b. Queue Service (`queue.service.ts`)

Add three things:
1. Import the consumer
2. Inject via constructor
3. Add `case` statements in the `createWorker` switch:

```typescript
case `${QueueAction.SEND}-${ChannelType.<CHANNEL_TYPE>}`:
  await this.<providerCamelCase>NotificationConsumer.process<ProviderName>NotificationQueue(job.data.id);
  break;

// If confirmation required:
case `${QueueAction.DELIVERY_STATUS}-${ChannelType.<CHANNEL_TYPE>}`:
  await this.<providerCamelCase>NotificationConsumer.process<ProviderName>NotificationConfirmationQueue(job.data.id);
  break;
```

### 6c. Constants (`notifications.ts`)

Add to:
- `ChannelType` — only if this is a new channel type (not already existing)
- `RecipientKeyForChannelType` — map channel type to data field key (e.g., `'to'`, `'target'`)
- `SkipProviderConfirmationChannels` — add channel type if no confirmation needed
- `ProviderDeliveryStatus` — add success/failure states if confirmation is needed

## Step 7: Seed Master Provider

Add entry to the `masterProvidersData` array in `apps/api/src/database/migrations/1745495895857-InitialSeed.ts`:

```typescript
{
  name: '<PROVIDER_DISPLAY_NAME>',
  provider_type: <channel_type_number>,
  configuration: {
    CONFIG_KEY: {
      label: 'Human Readable Label',
      id: 'CONFIG_KEY',
      pattern: '^validation-regex$',
      type: 'string',
    },
    // ... more config fields
  },
},
```

**Important:** The `configuration` keys must match exactly what the provider service reads via `this.providersService.getConfigById(providerId)`.

## Step 8: Verify

1. Run `cd apps/api && npm run build` — must succeed
2. Run `cd apps/api && npm run lint` — must pass
3. Run the database migration: `cd apps/api && npm run typeorm:run-migration`
4. Verify the new master provider appears in the master_providers table
5. Create a provider instance via the portal or API with valid configuration
6. Send a test notification through the new provider

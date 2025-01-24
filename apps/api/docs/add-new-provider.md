# Add New Provider

This document outlines the steps required to create a new provider for sending notifications via your preferred channel in OsmoX, if it does not already exist. By following these steps, you'll be able to create a new channel type that can be used for sending notifications.

## Pre-requisites

Before working on adding a new provider, ensure that you have set up the OsmoX development environment on your system, by following [Development Setup](development-setup.md) guide.

## Getting Started

#### 1. Install additional required dependencies

  For adding a new provider, it is highly likely one or more new `npm` packages will be required. Install these packages and dependencies using `npm`.

  ```sh
  npm install <package_name>
  ```

#### 2. Update the database

  Set the respective details of newly added provider in `notify_master_providers` table. This contains the configuration template and other related details for your provider.

  To use this provider, create a new entry in `notify_providers` table. This will contain and save the configuration details for your provider. Also set the `is_enabled` field as 1 to enable the provider. These details will be used for the OsmoX APP process.

  Take reference for what fields need to be added from [Database Design Document](./database-design.md#notify_master_providers).

#### 3. Update `src/common/constants/notifications.ts`

  A new channel type will be denoted using a unique numeric value (for example, 1 for SMTP, 2 for Mailgun, etc). The new provider being added will also need to represented with such a value.

  For this, update the `src/common/constants/notifications.ts` file to add your new provider name and assign a unique number:

  ```ts
  export const ChannelType = {
    SMTP: 1,
    MAILGUN: 2,
    WA_360_DAILOG: 3,
    <CHANNEL_NAME>: <number>,
  };
  ```

  If the provider allows verification methods for checking if the message was successfully sent to the end user, add the success and fail states in `ProviderDeliveryStatus`. Check the official provider documentation for exact states used.

  **Note:** OsmoX only considers success/fail states. Neutral states like `queued` should be mapped to either success or failure states based on your requirements.

  If the provider does not provide verification methods, add it to `SkipProviderConfirmationChannels`

#### 4. Generate a new module for the provider

  Create a new module for the provider, run the following command to generate it using `nest`:

  ```sh
    npx @nestjs/cli generate module modules/providers/<channel_name>
  ```

  The `providers.module.ts` file will automatically update to import this new service and add it in the `providers` array.

  Remove the new added module from `providers.module.ts` and add it in `notifications.module.ts` register logic. Ex:

  ```ts
  const providerModules = [
    // Rest of the modules...
    NewProviderModule,
  ]
  ```

#### 5. Generate new service file

  The new provider will require a service file. For this, run the following command to generate it using `nest`:

  ```sh
  npx @nestjs/cli generate service modules/providers/<channel_name>
  ```

  The `providers.module.ts` file will automatically update to import this new service and add it in the `providers` array. Remove it from `providers.module.ts` and add it to the earlier created channel specific module.

  Ex `channeltype.module.ts`
  ```ts
  import { Logger, Module } from '@nestjs/common';
  import { <channeltype>Service } from './channeltype.service';
  import { ConfigModule } from '@nestjs/config';
  import { ProvidersModule } from '../providers.module';
  import { ProvidersService } from '../providers.service';

  @Module({
    imports: [ConfigModule, ProvidersModule],
    providers: [<channeltype>Service, ProvidersService, Logger],
    exports: [<channeltype>Service],
  })
  export class <channeltype>Module {}
  ```

  Make sure to import `ConfigModule` if the service file will be using related env variables.

#### 6. Add logic in `.service.ts` file

  Add the required logic in the `.service.ts` file, referring already added service files. A few points that can help in adding the logic are as follows:

  - Import needed modules from the newly added dependencies
  - Create an interface for inputting data to the service function
  - Create a constructor for initializing and configuring the object as needed. Also initialize and use any environment variables as needed.
  - Importing env in constructor with getOrThrow will let us know if something is missing in env file.
  - Create a `send` method named after `<type>` (`sendEmail`, `sendSms`, etc) which accepts the notification data and add code logic for sending it. Return the response received.
  - Add any other helper methods as needed

  If the provider allows verification methods for checking if the message was successfully sent to the end user, add method `getDeliveryStatus` to verify if the message was successfully sent or not.

#### 7. Add dto for validation

  Add dto for `data` field validation in `src/modules/notifications/dtos/providers/<channel_type>-data.dto.ts`

  ```ts
  export class ExampleProviderDataDto {
    @IsString()
    @IsNotEmpty()
    to: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsOptional()
    @IsString()
    templateId?: string;
  }
  ```

  Update the file `src/common/decorators/is-data-valid.decorator.ts` and add condition for the newly added dto.

  ```ts
  switch (channelTypeFromProviderId) {
    // Other Cases
    case ChannelType.<CHANNEL_TYPE>: {
      const channelTypeData = new <CHANNEL_TYPE>DataDto();
      Object.assign(channelTypeData, value);
      await validateAndThrowError(channelTypeData);
      return true;
    }
    default:
      // Rest of the code...
  }
  ```

#### 8. Create `.job.consumer.ts` file

  Create a consumer file with path `src/jobs/consumers/notifications/<channel_name>-notification.job.consumer.ts`. Add the required logic in it by referring other consumer files, following these key points:

  - The constructor should inject the `Notification` repository, and declare class variables for the added service and `NotificationsService`
  - All functions return data to the parent functions present in `src/jobs/consumers/notifications/notification.consumer.ts`
  - Get the notification from database using the `getNotificationById(id)` method from `NotificationsService`
  - Exception handling should be done, and status should be updated accordingly as per success or failure in the database
  - Ensure logs are added for error logging

  Following methods are to be added:

  **process<Channel-Type>NotificationQueue (main function)**
    - Return `super processNotificationQueue`
    - Call your `send` method that was added in the service file and update the received result in database

  **process<Channel-Type>NotificationConfirmationQueue (as needed)**
    - Return `super processAwaitingConfirmationNotificationQueue`
    - If the provider allows verification methods for checking if the message was successfully sent to the end user, call your `getDeliveryStatus` method that was added in the service file and update the received result in database

#### 9. Update `.queue.ts` file

  All providers will be using a queue specific to them for queuing notifications that have to be sent. The required values for this queue for a provider is specified in the `src/modules/notifications/queues/queue.service.ts` file.

  Add dependency injection for `<CHANNEL_NAME>NotificationConsumer`:

  ```ts
  constructor(
    //...
    private readonly <channel_name>NotificationConsumer: <CHANNEL_NAME>NotificationConsumer,
  ) {}
  ```

  Add switch cases in `createWorker` function for creating the following queues as required:
  - NotificationQueue
  - NotificationConfirmationQueue
  - Webhook

  ```ts
  // Inside switch case
  switch (`${action}-${providerType}`) {
    // <CHANNEL_NAME> cases
    case `${QueueAction.SEND}-${ChannelType.<CHANNEL_NAME>}`:
      await this.<channel_name>NotificationConsumer.processCHANNEL_NAMENotificationQueue(job.data.id);
      break;
    case `${QueueAction.DELIVERY_STATUS}-${ChannelType.<CHANNEL_NAME>}`:
      await this.<channel_name>NotificationConsumer.processCHANNEL_NAMENotificationConfirmationQueue(job.data.id);
      break;

    // WEBHOOK
    case `${QueueAction.WEBHOOK}-${ChannelType.<CHANNEL_NAME>}`:
  }
  ```

#### 10.  Create migration file for database related changes

  - Add migration file(s) in `src/database/migrations` for accomodating any database related changes.
  - Keep filename as `<Unix epoch Timestamp in miliseconds>-migrationName` (e.g., `1701000000000-add-new-provider-config.ts`).
  - Create and test both `migration.up()` and `migration.down()` methods.

#### 11.  Update and add documentation

  Add a new document `<channel_name>.md` in the `docs/channels` folder describing environment variables to be set and how to use the new provider channel with sample request body and any additional information. Update the `usage-guide.md` file to add and link the new channel document under [Available Channel Types](usage-guide.md#5-available-channel-types).

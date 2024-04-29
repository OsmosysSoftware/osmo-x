# Add New Provider

This document outlines the steps required to create a new provider for sending notifications via your preferred channel in OsmoX, if it does not already exist. By following these steps, you'll be able to create a new channel type that can be used for sending notifications.

## Pre-requisites

Before working on adding a new provider, ensure that you have set up the OsmoX development environment on your system, by following [Development Setup](development-setup.md) guide.

## Getting Started

1. **Install additional required dependencies**

    For adding a new provider, it is highly likely one or more new `npm` packages will be required. Install these packages and dependencies using `npm`.

    ```sh
    npm install <package_name>
    ```

2. **Update the database**

    Set the respective details of newly added provider in `notify_master_providers` table. This contains the configuration template and other related details for your provider.

    To use this provider, create a new entry in `notify_providers` table. This will contain and save the configuration details for your provider. Also set the `is_enabled` field as 1 to enable the provider. These details will be used for the OsmoX APP process.

    Take reference for what fields need to be added from [Database Design Document](./database-design.md).

3. **Update `src/common/constants/notifications.ts`**

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

4. **Create `.queue.ts` file**

    All providers will be using a queue specific to them for queuing notifications that have to be sent. The required values for this queue for a provider is specified in the `src/modules/notifications/queues` folder.

    Create a new queue file with the naming convention `<channel_name>.queue.ts` and add the required values such as the queue name and queue config:

    ```ts
    export const CHANNEL_NAME_QUEUE = 'channel_name';

    export const channelNameQueueConfig = {
      name: CHANNEL_NAME_QUEUE,
    };
    ```

5. **Generate a new module for the provider**

    Create a new module for the provider, run the following command to generate it using `nest`:

    ```sh
     nest generate module modules/providers/<channel_name>
    ```

    The `app.module.ts` file will automatically update to import this new service and add it in the `providers` array.

    Remove the new added module from `app.module.ts` and add it in `notifications.module.ts` register logic.
    Ex:

    ```js
    // Load NewProvider
    modulesToLoad.push(NewProviderModule);
    queuesToLoad.push(NewProviderConfig);
    consumersToLoad.push(NewProviderNotificationConsumer);
    ```

5. **Generate new service file**

    The new provider will require a service file. For this, run the following command to generate it using `nest`:

    ```sh
    nest generate service modules/providers/<channel_name>/<channel_name>
    ```

    The `app.module.ts` file will automatically update to import this new service and add it in the `providers` array.

    Remove it from `app.module.ts` and add it to the earlier created channel specific module.

    Ex
    ```js
    import { Module } from '@nestjs/common';
    import { MailgunService } from './mailgun.service';
    import { ConfigModule } from '@nestjs/config';

    @Module({ imports: [ConfigModule], providers: [MailgunService], exports: [MailgunService] })
    export class MailgunModule {}
    ```
    Make sure to import ConfigModule too as service file will most probably be using related env variables.

6. **Add logic in `.service.ts` file**

    Add the required logic in the `.service.ts` file, referring already added service files. A few points that can help in adding the logic are as follows:

    - Import needed modules from the newly added dependencies
    - Create a constructor for initializing and configuring the object as needed. Also initialize and use any environment variables as needed. Importing env in constructor with getOrThrow will let us know if something is missing in env file.
    - Create a `send` method named after `<type>` (`sendEmail`, `sendSms`, etc) which accepts the notification data and add code logic for sending it. Return the response received.

7. **Add dto for validation**
    Add dto for `data` field validation at the location `src/modules/notifications/dtos/providers/<channel_type>-data.dto.ts`
    Update the file `src/common/decorators/is-data-valid.decorator.ts` and add condition for the newly added dto.

8. **Create `.job.consumer.ts` file**

    Create a consumer file with path `src/jobs/consumers/notifications/<channel_name>.job.consumer.ts`. Add the required logic in it by referring other consumer files, following these key points:

    - The consumer should export a class with `@Processor(CHANNEL_NAME_QUEUE)` decorator
    - The constructor should inject the `Notification` repository, and declare class variables for the added service and `NotificationsService`
    - The class should have a method with `@Process` decorator accepting an argument of type `Job<number>`
    - Get the notification from database using the `getNotificationById(id)` method from `NotificationsService`
    - Call your `send` method that was added in the service file and update the received result in database
    - Exception handling should be done, and status should be updated accordingly as per success or failure in the database
    - Ensure logs are added for error logging

9. **Update `notifications.job.producer.ts` file**

    Update the `src/jobs/producers/notifications/notifications.job.producer.ts` file by adding a new switch case to `addNotificationToQueue()` to your new queue if its channel type matches with your new provider channel.

    ```ts
    case ChannelType.CHANNEL_NAME:
      await this.channelNameQueue.add(notification.id);
      break;
    ```

10. **Update and add documentation**

    Add a new document `<channel_name>.md` in the `docs/channels` folder describing environment variables to be set and how to use the new provider channel with sample request body and any additional information. Update the `usage-guide.md` file to add and link the new channel document under [5. Available Channel Types](usage-guide.md#5-available-channel-types).

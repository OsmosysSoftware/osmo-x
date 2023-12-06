# Add New Provider

This document outlines the steps required to create a new provider for sending notifications via your preferred channel in Osmo-Notify, if it does not already exist. By following these steps, you'll be able to create a new channel type that can be used for sending notifications.

## Pre-requisites

Before working on adding a new provider, ensure that you have set up the Osmo-Notify development environment on your system, by following [Development Setup](development-setup.md) guide.

## Getting Started

1. **Install additional required dependencies**

    For adding a new provider, it is highly likely one or more new `npm` packages will be required. Install these packages and dependencies using `npm`.

    ```sh
    npm install <package_name>
    ```

2. **Update `.env` and `.env.example`**

    If your new provider requires configuration values that will be set via the `.env` file, make sure to also update the `.env.example` file so that new users are up to date with needed environment variables and values.
    You need to have a env value to determine whether or not to enable the provider.

    ```sh
    ENABLE_MY_NEW_SERVICE=true
    ```

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

    Additionally, update the `generateEnabledChannelEnum` function for checking and enabling your new channel:

    ```ts
    if (configService.get('ENABLE_CHANNEL_NAME') === 'true') {
      enabledChannels[<CHANNEL_NAME>] = ChannelType.<CHANNEL_NAME>;
    }
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

    Remove the new added module from `app.module.ts` and add it in notifications module register logic.
    Ex:

    ```js
    if (configService.get<string>('ENABLE_MAILGUN') === 'true') {
      modulesToLoad.push(MailgunModule);
      queuesToLoad.push(mailgunQueueConfig);
      consumersToLoad.push(MailgunNotificationConsumer);
    }
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

    Additionally, update the [Development Setup](development-setup.md) and [Production Setup](production-setup.md) documents for the updated `.env` file variables and any other relevant changes.

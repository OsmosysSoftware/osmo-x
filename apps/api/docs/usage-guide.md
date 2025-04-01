# Usage Guide for OsmoX

## Introduction

Welcome to the usage guide for OsmoX, a powerful notification management system designed to simplify the process of sending notifications through various channels. This guide will walk you through the steps of integrating OsmoX into your application and making the most of its features.

## Table of Contents

- [Usage Guide for OsmoX](#usage-guide-for-osmox)
  - [Introduction](#introduction)
  - [Table of Contents](#table-of-contents)
  - [1. Overview](#1-overview)
  - [2. Pushing Data to the Database](#2-pushing-data-to-the-database)
  - [3. Setup](#3-setup)
  - [4. Using the OsmoX API](#4-using-the-osmox-api)
    - [x-api-key Header](#x-api-key-header)
  - [5. Tracking Notification Status](#5-tracking-notification-status)
  - [6. Available Channel Type End Providers](#6-available-channel-type-end-providers)
  - [7. Delivery Status Information](#7-delivery-status-information)
  - [8. Test Mode Feature](#8-test-mode-feature)

## 1. Overview

OsmoX offers a streamlined solution for sending notifications via different channel providers.

- The system monitors the `notify_notifications` database table and automatically dispatches notifications for records with a `PENDING` status.
- For records with `AWAITING_CONFIRMATION` status, the system verifies successful message delivery to the end user as long as the service is supported by the end provider (e.g., Mailgun, Twilio).
- Additionally, users can set up custom webhooks for verification purposes.

## 2. Pushing Data to the Database

Developers have the flexibility to populate the `notify_notifications` database table directly or opt for the recommended approach of utilizing the OsmoX API. By following this method, the notification processing is seamlessly managed by OsmoX.

For more information, please refer to the [OsmoX database design](./database-design.md)

## 3. Setup

1. Set up the codebase and start the API as per requirement:
   - [Development Setup](./development-setup.md)
   - [Production Setup](./production-setup.md)
2. OsmoX has seeded [Master Provider](#6-available-channel-type-end-providers) & [Admin User](../src/database/migrations/1692870736646-seeddata.ts) data to facilitate notification service setup.
3. Get the Bearer Token for the seeded Admin user using the [login API](./api-documentation.md#login)
4. Create a new `Application` as per requirement using the [create new application API](./api-documentation.md#create-new-application).
5. Create a new `Provider` that will be used to send notifications using the [create new provider API](./api-documentation.md#create-new-provider).
6. Generate a new `x-api-key` for the newly created application by using the [generate new server api key API](./api-documentation.md#generate-new-server-api-key).
7. Header `x-api-key` will be used for OsmoX notification service requests.

Now you can use the OsmoX API to send notifications.

## 4. Using the OsmoX API

To use the OsmoX API, follow these steps: [Create Notification API](./api-documentation.md#create-notification)

- **Method:** POST
- **Endpoint:** `/notifications`

### x-api-key Header

To add the API key to the x-api-key header, use the following format:

```plaintext
x-api-key: SERVER_API_KEY_VALUE
```

Replace `SERVER_API_KEY_VALUE` with the actual API key value you want to include in the header.

**Sample Request Body:**

```json
{
  "providerId": 1,
  "data": {
    "from": "sender@example.com",
    "to": "recipient@example.com",
    "subject": "Test subject",
    "text": "This is a test notification",
    "html": "<b>This is a test notification</b>"
  }
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "notification": {
      "providerId": 1,
      "channelType": 1,
      "data": {
        "from": "sender@example.com",
        "to": "recipient@example.com",
        "subject": "Test subject",
        "text": "This is a test notification",
        "html": "<b>This is a test notification</b>"
      },
      "applicationId": 1,
      "createdBy": "OsmoX",
      "updatedBy": "OsmoX",
      "result": null,
      "id": 36,
      "deliveryStatus": 1,
      "createdOn": "2023-09-08T13:11:52.000Z",
      "updatedOn": "2023-09-08T13:11:52.000Z",
      "status": 1
    }
  }
}
```

For detailed information, please refer to the [OsmoX API documentation](./api-documentation.md)

## 5. Tracking Notification Status

OsmoX updates the `delivery_status` and `result` columns to provide information on the notification's status. Use these columns to track the progress of your notifications in database.

## 6. Available Channel Type End Providers

OsmoX supports multiple channel types, allowing you to choose the most suitable one for your notifications. Currently, the available channel types are:

|           **Channel Type**           | **Value** |                          **Document**                          |
| :----------------------------------: | :-------: | :------------------------------------------------------------: |
| SMTP - Simple Mail Transfer Protocol |     1     |                    [SMTP](channels/smtp.md)                    |
|               Mailgun                |     2     |                 [Mailgun](channels/mailgun.md)                 |
|         WhatsApp - 360Dialog         |     3     |        [WhatsApp - 360Dialog](channels/wa-360Dialog.md)        |
|          WhatsApp - Twilio           |     4     |           [WhatsApp - Twilio](channels/wa-Twilio.md)           |
|             SMS - Twilio             |     5     |             [SMS - Twilio](channels/sms-Twilio.md)             |
|             SMS - Plivo              |     6     |              [SMS - Plivo](channels/sms-Plivo.md)              |
|     WhatsApp - Twilio (Business)     |     7     | [WhatsApp - Twilio (Business)](channels/wa-Twilio-Business.md) |
|           SMS - KAPSystem            |     8     |          [SMS - KAPSystem](channels/sms-kapsystem.md)          |
|        PushNotification - SNS        |     9     |        [Push Notification - SNS](channels/push-sns.md)         |
|         Voice Call - Twilio          |    10     |          [Voice Call - Twilio](channels/vc-twilio.md)          |
|           Email - AWS SES            |    11     |             [Email - AWS SES](channels/aws-ses.md)             |
|          SMS - AWS SMS SNS           |    12     |            [SMS - AWS SMS SNS](channels/sms-sns.md)            |

## 7. Delivery Status Information

OsmoX provides different delivery status options to reflect the state of your notifications:

|      **Status**       |                 **Description**                  | **Value** |
| :-------------------: | :----------------------------------------------: | :-------: |
|        PENDING        |     The notification is awaiting processing.     |     1     |
|      IN PROGRESS      |     The notification is currently being sent     |     2     |
| AWAITING_CONFIRMATION |    The notification is awaiting confirmation     |     3     |
|  QUEUED_CONFIRMATION  | The notification is added to confirmation queue. |     4     |
|        SUCCESS        |   The notification was successfully delivered.   |     5     |
|        FAILED         |        The notification delivery failed.         |     6     |

For more information, please refer to the [Delivery Status Lifecycle](docs/delivery-status-lifecycle.md)

## 8. Test Mode Feature

OsmoX Admin users can enable/disable **Test Mode** for applications. This feature allows end applications using the OsmoX service to perform functional testing without sending unnecessary notifications to end recipients

- Providers associated with test mode enabled application DO NOT send notifications to end recipients.
- Admin users can add a whitelist which sends notifications to recipients present in the whitelist
- Whitelist must be a either null or a valid JSON with string of provider id as keys and arrays of strings of recipients as values

For detailed information, please refer to the [OsmoX Test Mode guide](./test-mode-guide.md)
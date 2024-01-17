# Usage Guide for Osmo-Notify

## Introduction

Welcome to the usage guide for Osmo-Notify, a powerful notification management system designed to simplify the process of sending notifications through various channels. This guide will walk you through the steps of integrating Osmo-Notify into your application and making the most of its features.

## Table of Contents

- [Usage Guide for Osmo-Notify](#usage-guide-for-osmo-notify)
  - [Introduction](#introduction)
  - [Table of Contents](#table-of-contents)
  - [1. Overview](#1-overview)
  - [2. Pushing Data to the Database](#2-pushing-data-to-the-database)
  - [3. Using the Osmo-Notify API](#3-using-the-osmo-notify-api)
  - [4. Tracking Notification Status](#4-tracking-notification-status)
  - [5. Available Channel Types](#5-available-channel-types)
  - [6. Delivery Status Information](#6-delivery-status-information)

## 1. Overview

Osmo-Notify offers a streamlined solution for sending notifications via different channels. It operates by monitoring the `notify_notifications` database table and automatically dispatches notifications for records with a `PENDING` status.

## 2. Pushing Data to the Database

Developers have the flexibility to populate the `notify_notifications` database table directly or opt for the recommended approach of utilizing the Osmo-Notify API. By following this method, the notification processing is seamlessly managed by Osmo-Notify.

## 3. Using the Osmo-Notify API

To use the Osmo-Notify API, follow these steps:

- **Method:** POST
- **Endpoint:** `/notifications`

### Authorization Header

To add a bearer token to the Authorization header, use the following format:

```plaintext
Authorization: Bearer SERVER_API_KEY_VALUE
```

Replace `SERVER_API_KEY_VALUE` with the actual API key value you want to include in the header.

**Sample Request Body:**
```json
{
  "channelType": 1,
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
      "channelType": 1,
      "data": {
        "from": "sender@example.com",
        "to": "recipient@example.com",
        "subject": "Test subject",
        "text": "This is a test notification",
        "html": "<b>This is a test notification</b>"
      },
      "createdBy": "osmo_notify",
      "updatedBy": "osmo_notify",
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

## 4. Tracking Notification Status

Osmo-Notify updates the `delivery_status` and `result` columns to provide information on the notification's status. Use these columns to track the progress of your notifications in database.

## 5. Available Channel Types

Osmo-Notify supports multiple channel types, allowing you to choose the most suitable one for your notifications. Currently, the available channel types are:

|           **Channel Type**           | **Value** |          **Document**          |
|:------------------------------------:|:---------:|:------------------------------:|
| SMTP - Simple Mail Transfer Protocol |     1     | [SMTP](channels/smtp.md)       |
| Mailgun                              |     2     | [Mailgun](channels/mailgun.md) |
| WhatsApp - 360Dialog                 |     3     | [WhatsApp - 360Dialog](channels/wa-360Dialog.md) |
| WhatsApp - Twilio                    |     4     | [WhatsApp - Twilio](channels/wa-Twilio.md) |

## 6. Delivery Status Information

Osmo-Notify provides different delivery status options to reflect the state of your notifications:

|  **Status** |                **Description**               | **Value** |
|:-----------:|:--------------------------------------------:|:---------:|
| PENDING     | The notification is awaiting processing.     |     1     |
| IN PROGRESS | The notification is currently being sent.    |     2     |
| SUCCESS     | The notification was successfully delivered. |     3     |
| FAILED      | The notification delivery failed.            |     4     |
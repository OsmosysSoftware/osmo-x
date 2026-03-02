# Usage Guide for OsmoX

## Introduction

Welcome to the usage guide for OsmoX, a multi-tenant notification management system for sending notifications through various channels. This guide walks you through configuring OsmoX and sending your first notification.

## Table of Contents

- [Usage Guide for OsmoX](#usage-guide-for-osmox)
  - [Introduction](#introduction)
  - [Table of Contents](#table-of-contents)
  - [1. Overview](#1-overview)
  - [2. Getting Started](#2-getting-started)
  - [3. Using the Portal](#3-using-the-portal)
  - [4. Using the API](#4-using-the-api)
    - [Authentication](#authentication)
    - [Sending a Notification](#sending-a-notification)
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

OsmoX provides two interfaces:

- **Portal** — Angular web application for managing applications, providers, notifications, and users
- **REST API** — Programmatic access for sending notifications and managing resources

## 2. Getting Started

1. Set up the codebase and start all services:
   - [Development Setup](./development-setup.md) (recommended starting point)
   - [Docker Compose Usage](./docker-compose-usage.md) (advanced Docker configuration)
   - [Production Setup](./production-setup.md)

2. Log in to the portal at <http://localhost:4200> with the admin credentials configured in your `.env` file (defaults: `admin@osmox.dev` / `Admin123`). See [Development Setup — Default Admin Credentials](./development-setup.md#default-admin-credentials) for details.

3. From the portal, complete the initial setup:
   - **Create an Application** — Navigate to Applications and create a new application for your project.
   - **Create a Provider** — Navigate to Providers and configure a provider (e.g., SMTP, Mailgun, Twilio) with your credentials.
   - **Generate an API Key** — Navigate to Server API Keys and generate a key for your application.

4. Use the API key to send notifications (see [Using the API](#4-using-the-api) below).

> **Tip:** OsmoX seeds [Master Provider](#6-available-channel-type-end-providers) data during the initial migration, so provider types are ready to use. You only need to create provider instances with your credentials.

## 3. Using the Portal

The portal is available at <http://localhost:4200> (Docker) or your configured host.

Key sections:

| Section | Description |
| --- | --- |
| **Dashboard** | Overview of notification counts by status and channel |
| **Notifications** | View and filter active notifications |
| **Archived Notifications** | View completed/archived notifications |
| **Applications** | Create and manage applications |
| **Providers** | Configure notification providers with credentials |
| **Provider Chains** | Set up fallback provider sequences per application |
| **Server API Keys** | Generate and manage API keys for applications |
| **Users** | Manage users and roles (Super Admin only) |
| **Organizations** | Manage organizations (Super Admin only) |

### Roles

| Role | Access |
| --- | --- |
| `SUPER_ADMIN` | Full platform access, manage all organizations |
| `ORG_ADMIN` | Manage resources within their organization |
| `ORG_USER` | Read-only access within their organization |

## 4. Using the API

All API endpoints are prefixed with `/api`. Interactive API documentation is available via Swagger at <http://localhost:3000/api>.

### Authentication

OsmoX uses JWT authentication. Obtain a token by logging in:

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@osmox.dev", "password": "Admin123"}'
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Use the `access_token` as a Bearer token in subsequent requests:

```plaintext
Authorization: Bearer <access_token>
```

### Sending a Notification

**Endpoint:** `POST /api/notifications`

### x-api-key Header

Application-level requests use the `x-api-key` header for authentication:

```plaintext
x-api-key: SERVER_API_KEY_VALUE
```

Replace `SERVER_API_KEY_VALUE` with the actual API key generated for your application.

**Sample Request:**

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "providerId": 1,
    "data": {
      "from": "sender@example.com",
      "to": "recipient@example.com",
      "subject": "Test subject",
      "text": "This is a test notification",
      "html": "<b>This is a test notification</b>"
    }
  }'
```

**Sample Response:**

```json
{
  "status": "success",
  "data": {
    "notification": {
      "provider_id": 1,
      "data": {
        "from": "sender@example.com",
        "to": "recipient@example.com",
        "subject": "Test subject",
        "text": "This is a test notification",
        "html": "<b>This is a test notification</b>"
      },
      "application_id": 1,
      "channel_type": 1,
      "delivery_status": 1,
      "created_on": "2024-01-15T10:30:00.000Z",
      "id": 1
    }
  }
}
```

For the full API reference, see the [Swagger docs](http://localhost:3000/api) or the [API Documentation](./api-documentation.md).

## 5. Tracking Notification Status

OsmoX updates the `delivery_status` and `result` columns to provide information on the notification's status. You can track status through:

- **Portal** — The Notifications and Archived Notifications pages show delivery status with filters
- **API** — Query `GET /api/notifications` with filter parameters
- **Database** — Check `delivery_status` and `result` columns in `notify_notifications`

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
|           SMS - KAPSystem            |     8     |              We no longer support SMS - KAPSystem              |
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

For more information, please refer to the [Delivery Status Lifecycle](./delivery-status-lifecycle.md)

## 8. Test Mode Feature

OsmoX Admin users can enable/disable **Test Mode** for applications. This feature allows end applications using the OsmoX service to perform functional testing without sending unnecessary notifications to end recipients.

- Providers associated with test mode enabled application DO NOT send notifications to end recipients.
- Admin users can add a whitelist which sends notifications to recipients present in the whitelist.
- Whitelist must be either null or a valid JSON with string of provider id as keys and arrays of strings of recipients as values.

For detailed information, please refer to the [OsmoX Test Mode guide](./test-mode-guide.md)

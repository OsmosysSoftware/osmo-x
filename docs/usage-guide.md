# Usage Guide for Osmo-Notify

## Introduction

Welcome to the usage guide for Osmo-Notify, a powerful notification management system designed to simplify the process of sending notifications through various channels. This guide will walk you through the steps of integrating Osmo-Notify into your application and making the most of its features.

## Table of Contents

1. [Overview](#overview)
2. [Pushing Data to the Database](#pushing-data-to-the-database)
3. [Using the Osmo-Notify API](#using-the-osmo-notify-api)
4. [Tracking Notification Status](#tracking-notification-status)
5. [Available Channel Types](#available-channel-types)
6. [Delivery Status Information](#delivery-status-information)

## 1. Overview

Osmo-Notify offers a streamlined solution for sending notifications via different channels. It operates by monitoring the `notify_notifications` database table and automatically dispatches notifications for records with a `PENDING` status.

## 2. Pushing Data to the Database

Developers have the flexibility to populate the `notify_notifications` database table directly or opt for the recommended approach of utilizing the Osmo-Notify API. By following this method, the notification processing is seamlessly managed by Osmo-Notify.

## 3. Using the Osmo-Notify API

To use the Osmo-Notify API, follow these steps:

- **Method:** POST
- **Endpoint:** `/notifications`

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
  "notification": {
    "channelType": "smtp-server",
    "data": {
      "from": "sender@example.com",
      "to": "recipient@example.com",
      "subject": "Test subject",
      "text": "This is a test notification",
      "html": "<b>This is a test notification</b>"
    },
    "deliveryStatus": 1,
    "createdBy": "osmo-notify",
    "createdOn": "2023-08-25T10:55:36.794Z",
    "result": null,
    "modifiedBy": null,
    "modifiedOn": null,
    "id": 1
  }
}
```

## 4. Tracking Notification Status

Osmo-Notify updates the `deliveryStatus` and `result` columns to provide information on the notification's status. Use these columns to track the progress of your notifications.

## 5. Available Channel Types

Osmo-Notify supports multiple channel types, allowing you to choose the most suitable one for your notifications. Currently, the available channel types are:

- **SMTP (Simple Mail Transfer Protocol):** ChannelType = 1

## 6. Delivery Status Information

Osmo-Notify provides different delivery status options to reflect the state of your notifications:

- **PENDING:** The notification is awaiting processing. DeliveryStatus = 1
- **IN PROGRESS:** The notification is currently being sent. DeliveryStatus = 2
- **SUCCESS:** The notification was successfully delivered. DeliveryStatus = 3
- **FAILED:** The notification delivery failed. DeliveryStatus = 4
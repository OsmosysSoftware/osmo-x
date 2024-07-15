# Osmox Webhook Configuration and Usage Guide

## Introduction

Webhooks are a powerful way to receive real-time updates and notifications from various services. Osmox supports webhook integration to streamline notifications through services like Mailgun and Twilio. This guide will help you configure and use webhooks in Osmox effectively.

## Prerequisites

Before you start, ensure you have the following:

- An active Osmox account.
- A webhookUrl that your application will listen for webhook data
- A providerID on which you want to add webhook.

## Setting Up Webhooks in Osmox

To start using webhooks in Osmox, follow these steps:

## Webhook Registration

To register a webhook programmatically, you can use the following GraphQL mutation:

```graphql
mutation RegisterWebhook {
    webhook(createWebhookInput: {
        providerId: 10,
        webhookUrl: "http://localhost:4200/webhook",
    }) {
        webhookUrl
        providerId
        createdOn
        updatedOn
        status
    }
}
```

```sh
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'x-api-key: OsmoX-test-key' \
--header 'Authorization: Bearer OsmoX-test-key' \
--data '{"query":"mutation RegisterWebhook {\n    webhook(createWebhookInput: {\n        providerId: 10,\n        webhookUrl: \"http://localhost:4200/webhook\",\n    }) {\n        webhookUrl\n        providerId\n        createdOn\n        updatedOn\n        status\n    }\n}","variables":{}}'

```

### Example Response

```json
{
    "data": {
        "webhook": {
            "webhookUrl": "http://localhost:4200/webhook",
            "providerId": 10,
            "createdOn": "2024-07-15T05:04:00.000Z",
            "updatedOn": "2024-07-15T05:04:00.000Z",
            "status": 1
        }
    }
}
```

## Handling Webhook Events

Once a webhook is registered, Osmox will start sending notifications to the specified URL. Your endpoint should be able to handle the incoming POST requests.

### Example Payload

Osmox will send a payload containing the event details. Here's an example:

```sh
{
  id: 51,
  providerId: 4,
  channelType: 8,
  data: {
    indiaDltContentTemplateId: '1607100000000292563',
    indiaDltPrincipalEntityId: '1601538161788246351',
    to: '+919810450807',
    text: 'Dear Lakshaya, A new ticket ABCDEF is created.\n' +
      '\n' +
      'Reagrds,\n' +
      'OQSHA\n' +
      'Powered by Osmosys'
  },
  deliveryStatus: 5,
  result: { result: { messages: [Array] } },
  createdOn: '2024-07-12T09:14:26.000Z',
  updatedOn: '2024-07-12T09:14:27.000Z',
  createdBy: 'sampleOsmoXApp',
  updatedBy: 'sampleOsmoXApp',
  status: 1,
  applicationId: 1,
  retryCount: 0
}
```

### Processing the Payload

Your webhook handler should able to extract the required information from the payload and perform action on your application : like updating the database for the status etc.
Note: We are sending the complete notification object from our end

## Webhook Verification

This is not yet incorporated but will be happening in the future

### Retry Strategy

Osmox uses an exponential backoff strategy for retries. If a request fails, it will retry after increasing intervals.

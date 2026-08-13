# Osmox Webhook Configuration and Usage Guide

## Introduction

Webhooks are a powerful way to receive real-time updates and notifications from various services. Osmox supports webhook integration to streamline notifications through services like Mailgun and Twilio. This guide will help you configure and use webhooks in Osmox effectively.

Once a notification reaches a terminal state (`Success` or `Failed`), Osmox POSTs the complete notification object to the webhook URL registered for that notification's provider. Delivery is retried on failure, and every attempt is recorded so it can be inspected later from the API or the portal.

## Prerequisites

Before you start, ensure you have the following:

- An active Osmox account.
- A webhookUrl that your application will listen for webhook data
- A providerID on which you want to add webhook.

## Configuration

Webhook behavior is controlled by the following environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBHOOK_MAX_RETRY_COUNT` | `5` | Maximum delivery attempts (the first attempt included) before the delivery is marked permanently `Failed`. |
| `WEBHOOK_RETRY_INTERVAL` | `30m` | Fixed delay between attempts. Uses [ms](https://github.com/vercel/ms) formats (`10s`, `5m`, `1h`). |
| `WEBHOOK_REQUEST_TIMEOUT_MS` | `10000` | Time to wait for your endpoint's response before treating the attempt as failed. |
| `WEBHOOK_LOG_RETENTION_DAYS` | `60` | Days to keep delivery attempt logs. **Leave empty to disable cleanup entirely** — the log table then grows unbounded. |
| `WEBHOOK_LOG_CLEANUP_INTERVAL_IN_SECONDS` | `86400` | How often `scheduler.sh` calls the log cleanup endpoint. |
| `SCHEDULER_INTERNAL_KEY` | — | **Required.** Shared secret `scheduler.sh` sends as the `x-scheduler-key` header to call internal endpoints such as log cleanup. Minimum 32 characters recommended. |

Invalid values for the retry/timeout variables are ignored with a warning at startup and the default is used instead — the application still boots.

> **Note:** All examples below assume `GLOBAL_API_PREFIX=api`. Drop the `/api` segment from the URLs if your deployment leaves the prefix empty.

## Setting Up Webhooks in Osmox

To start using webhooks in Osmox, follow these steps:

## Webhook Registration

Only one active webhook can exist per provider — registering a second one for the same provider returns a `409 Conflict`.

### REST (recommended)

```sh
curl --location 'http://localhost:3000/api/webhooks' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <jwt>' \
--data '{
    "provider_id": 10,
    "webhook_url": "http://localhost:4200/webhook"
}'
```

#### Example Response

```json
{
  "id": 3,
  "provider_id": 10,
  "webhook_url": "http://localhost:4200/webhook",
  "is_verified": 0,
  "status": 1,
  "last_delivery_status": null,
  "last_attempted_at": null,
  "created_on": "2024-07-15T05:04:00.000Z",
  "updated_on": "2024-07-15T05:04:00.000Z"
}
```

Related endpoints (all require a `Bearer` token with the `ORG_ADMIN` role or above, and are scoped to the caller's organization):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/webhooks?page=&limit=` | Paginated list of the organization's webhooks. |
| `POST` | `/api/webhooks` | Register a webhook. |
| `PUT` | `/api/webhooks` | Update a webhook URL (body: `id`, `webhook_url`). |
| `DELETE` | `/api/webhooks` | Soft-delete a webhook (body: `id`). |
| `GET` | `/api/webhooks/logs?webhook_id=&page=&limit=` | Paginated delivery attempt logs for one webhook. |
| `DELETE` | `/api/webhooks/logs/cleanup` | Deletes logs past the retention window. Scheduler-only — requires the `x-scheduler-key` header. |

### GraphQL (legacy)

The GraphQL API is frozen — it still works, but new fields such as `lastDeliveryStatus` are only exposed over REST.

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

#### Example Response

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

The call is a `POST` with `Content-Type: application/json`. Respond with any `2xx` status within `WEBHOOK_REQUEST_TIMEOUT_MS` to have the attempt counted as successful — any other status, a connection error, or a slower response is treated as a failure and retried.

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

The webhook fires only after the notification's final outcome has been persisted, so `result` always reflects the real provider response — including the error details when `deliveryStatus` is `6` (Failed).

### Processing the Payload

Your webhook handler should able to extract the required information from the payload and perform action on your application : like updating the database for the status etc.
Note: We are sending the complete notification object from our end

Because a failed delivery is retried, your endpoint may receive the same notification `id` more than once. Handle the payload idempotently — key off `id` rather than assuming exactly one call.

## Webhook Verification

This is not yet incorporated but will be happening in the future

## Retry Strategy

Osmox retries with a **fixed interval**, not exponential backoff:

1. The first attempt happens as soon as the notification reaches its final status.
2. If the attempt fails and attempts remain, it is logged with status `Retrying` and re-queued with a delay of `WEBHOOK_RETRY_INTERVAL`.
3. Once `WEBHOOK_MAX_RETRY_COUNT` attempts have been made, the delivery is logged as `Failed` and no further attempts are made.

Retries are queued through Redis rather than held in memory, so a worker restart does not lose a pending retry, and waiting for the next attempt does not block other notifications from being processed. With the defaults (`5` attempts, `30m` apart) a permanently unreachable endpoint is given up on after roughly two hours.

## Delivery Logs

Every attempt inserts a row into `notify_webhook_logs`:

| Field | Description |
|-------|-------------|
| `webhook_id` / `notification_id` | Which webhook and notification the attempt belongs to. |
| `attempt_number` | `1` for the first attempt, incrementing per retry. |
| `status` | `1` Retrying · `2` Success · `3` Failed |
| `http_status_code` | Status returned by your endpoint, or `null` if no response was received (timeout, connection refused). |
| `request_body` | The payload Osmox sent. |
| `response_body` | The body your endpoint returned. |
| `error_message` | Failure reason, e.g. `timeout of 10000ms exceeded`. |
| `requested_at` | When the attempt was made. |

Request and response bodies larger than 10 KB are stored truncated as `{ "truncated": true, "preview": "..." }`.

For a quick roll-up, `notify_webhooks` also carries `last_delivery_status` and `last_attempted_at` for the most recent attempt — these are what the portal's webhooks list shows as the "Last Delivery" badge, with a "View Logs" action for the full per-attempt history.

### Reading logs over the API

```sh
curl --location 'http://localhost:3000/api/webhooks/logs?webhook_id=3&page=1&limit=20' \
--header 'Authorization: Bearer <jwt>'
```

```json
{
  "items": [
    {
      "id": 412,
      "webhook_id": 3,
      "notification_id": 820167,
      "attempt_number": 2,
      "status": 2,
      "http_status_code": 200,
      "request_body": { "id": 820167, "deliveryStatus": 5, "result": { "...": "..." } },
      "response_body": { "ok": true },
      "error_message": null,
      "requested_at": "2026-08-10T19:49:11.204Z",
      "created_on": "2026-08-10T19:49:11.230Z"
    }
  ],
  "page_info": {
    "page": 1,
    "limit": 20,
    "total_items": 2,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

### Log retention

`scheduler.sh` calls `DELETE /api/webhooks/logs/cleanup` every `WEBHOOK_LOG_CLEANUP_INTERVAL_IN_SECONDS`, which deletes rows older than `WEBHOOK_LOG_RETENTION_DAYS`. The endpoint is not user-facing: it requires the `x-scheduler-key` header to match `SCHEDULER_INTERNAL_KEY` and returns `401` otherwise, including when the secret is not configured at all.

```sh
curl -X DELETE 'http://localhost:3000/api/webhooks/logs/cleanup' \
--header 'x-scheduler-key: <SCHEDULER_INTERNAL_KEY>'
```

## Troubleshooting

- **No log rows at all** — the notification has not reached a terminal status yet (`5`/`6`), or no active webhook exists for its provider. In the latter case the API logs `Webhook not found for providerId: <id>`.
- **`http_status_code: null` with a connection error** — Osmox could not reach the URL. Check that `webhook_url` is reachable from the API host; `localhost` inside a container means the container itself.
- **Attempts stop before `WEBHOOK_MAX_RETRY_COUNT`** — check the API log for `Failed to schedule webhook retry ...`, which means the retry could not be queued (e.g. Redis unavailable) and the delivery was marked `Failed` with `error_message` starting `Retry scheduling failed:`.
- **Deliveries time out under load** — your endpoint should acknowledge quickly and do its own work asynchronously, or raise `WEBHOOK_REQUEST_TIMEOUT_MS`.

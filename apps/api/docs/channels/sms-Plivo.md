## Plivo SMS

Plivo enables sending SMS through its API, allowing developers to programmatically send and receive text messages worldwide. Users integrate Plivo's API into their applications, triggering automated SMS messages for various purposes such as notifications, alerts, and customer communications.

Refer to the messaging documentation to dive deeper into the features Plivo offers and understand how it all works.

### Values to Update in Database

When using Twilio to send SMS messages via their API/Client, you need to provide certain variables that hold the Twilio configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 6 (for Plivo SMS)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key                  | Description             |
| -------------------- | ----------------------- |
| PLIVO_SMS_AUTH_ID    | Plivo Auth Id           |
| PLIVO_SMS_AUTH_TOKEN | Plivo Auth Token        |
| PLIVO_SMS_NUMBER     | Plivo registered Number |

```jsonc
// Sample json to set in configuration field
{
  "PLIVO_SMS_AUTH_ID": "PlivoAuthId",
  "PLIVO_SMS_AUTH_TOKEN": "PlivoAuthToken",
  "PLIVO_SMS_NUMBER": "+919000180002"
}
```

### Sample Request Body

Here's a sample request body:

```jsonc
{
  // Set your respective providerId. ChannelType associated with providerId should be 6 (Plivo SMS)
  "providerId": 6,
  "data": {
    "to": "+15005550006",
    "message": "This is a test message from OsmoX."
  }
}
```

### Dependencies

| Package Name | Version | Description                                          |
| ------------ | ------- | ---------------------------------------------------- |
| plivo        | ^4.70.0 | Plivo client for sending SMS and making voice calls. |

### References

- https://www.plivo.com/docs/messaging/quickstart/node-expressjs/

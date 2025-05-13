## Twilio SMS

Twilio enables sending SMS through its API, allowing developers to programmatically send and receive text messages worldwide. Users integrate Twilio APIs into their applications, triggering automated SMS messages for various purposes such as notifications, alerts, and customer communications.

### Values to Update in Database

When using Twilio to send SMS messages via their API/Client, you need to provide certain variables that hold the Twilio configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 5 (for Twilio SMS)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key                    | Description                    |
| ---------------------- | ------------------------------ |
| TWILIO_SMS_ACCOUNT_SID | Twilio SMS account SID         |
| TWILIO_SMS_AUTH_TOKEN  | Twilio SMS auth token          |
| TWILIO_SMS_NUMBER      | Twilio registered phone number |

```jsonc
// Sample json to set in configuration field
{
  "TWILIO_SMS_ACCOUNT_SID": "ACapiKeyMsg",
  "TWILIO_SMS_AUTH_TOKEN": "some-auth-token",
  "TWILIO_SMS_NUMBER": "+15005550006"
}
```

### Sample Request Body

Here's a sample request body:

```jsonc
{
  // Set your respective providerId. ChannelType associated with providerId should be 5 (Twilio SMS)
  "providerId": 5,
  "data": {
    "to": "+15005550006",
    "message": "Your appointment is coming up on March 21 at 2PM"
  }
}
```

### Dependencies

| Package Name | Version | Description                                                                                 |
| ------------ | ------- | ------------------------------------------------------------------------------------------- |
| twilio       | ^5.6.0  | Twilio client for sending SMS, making voice calls, and other communication functionalities. |

### References

- https://www.twilio.com/docs/messaging/quickstart

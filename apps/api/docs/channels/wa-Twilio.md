## Twilio WhatsApp

Using the WhatsApp Business Platform with Twilio, you can send and receive messages to WhatsApp users using the same Twilio Messaging APIs you already know and enjoy. Dive into the Twilio SDKs and helper libraries, see our quickstart and API reference docs, read through guides on templates and Twilio phone numbers, and find the sample code you'll need.

### Values to Update in Database

When using Twilio to send whatsApp messages via their API/Client, you need to provide certain variables that hold the Twilio configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 4 (for Twilio WhatsApp)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key                   | Description                    |
| --------------------- | ------------------------------ |
| TWILIO_WA_ACCOUNT_SID | Twilio SMS account SID         |
| TWILIO_WA_AUTH_TOKEN  | Twilio SMS auth token          |
| TWILIO_WA_NUMBER      | Twilio registered phone number |

```jsonc
// Sample json to set in configuration field
{
  "TWILIO_WA_ACCOUNT_SID": "ACapiKeyMsg",
  "TWILIO_WA_AUTH_TOKEN": "some-auth-token",
  "TWILIO_WA_NUMBER": "+15005550006"
}
```

### Sample Request Body

Here's a sample request body:

```jsonc
{
  // Set your respective providerId. ChannelType associated with providerId should be 4 (Twilio WhatsApp)
  "providerId": 4,
  "data": {
      "to": "+919004812051",
      "message": "Your appointment is coming up on July 21 at 3PM"
  }
}
```

### Dependencies

| Package Name | Version | Description                                                                                 |
| ------------ | ------- | ------------------------------------------------------------------------------------------- |
| twilio       | ^5.8.0  | Twilio client for sending SMS, making voice calls, and other communication functionalities. |

References

- [Twilio WhatsApp documentation](https://www.twilio.com/docs/whatsapp)

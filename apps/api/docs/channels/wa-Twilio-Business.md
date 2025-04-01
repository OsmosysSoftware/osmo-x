## Twilio WhatsApp (Business)

Using the WhatsApp Business Platform with Twilio, you can send and receive messages to WhatsApp users using the same Twilio Messaging APIs you already know and enjoy. Dive into the Twilio SDKs and helper libraries, see the quickstart and API reference docs, read through guides on templates and Twilio phone numbers, and find the sample code you'll need.

This particular provider can be used to send WhatsApp messages generated using Content Template Builder.

### Values to Update in Database

When using Twilio to send WhatsApp messages via their API/Client, you need to provide certain variables that hold the Twilio configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 7 (for Twilio WhatsApp (Business))
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field:

| Key                   | Description            |
| --------------------- | ---------------------- |
| TWILIO_WA_ACCOUNT_SID | Twilio SMS account SID |
| TWILIO_WA_AUTH_TOKEN  | Twilio SMS auth token  |

```jsonc
// Sample json to set in configuration field
{
  "TWILIO_WA_ACCOUNT_SID": "ACXXXXXXXXXXXXXXXXX",
  "TWILIO_WA_AUTH_TOKEN": "someauthtoken",
}
```

### Sample Request Body

Here's a sample request body:

```jsonc
{
  // Set your respective providerId. channelType associated with providerId should be 7 (Twilio WhatsApp (Business))
  "providerId": 7,
  "data": {
    "contentSid": "HXXXXXXXXX",
    "from": "MGXXXXXXXX",
    "contentVariables": {
      "1": "Name",
      "2": "52", // Numbers should also be strings
    },
    "to": "+919004812051",
  },
}
```

### Dependencies

| Package Name | Version | Description                                                                                 |
| ------------ | ------- | ------------------------------------------------------------------------------------------- |
| twilio       | ^5.5.1  | Twilio client for sending SMS, making voice calls, and other communication functionalities. |

References

- [Twilio - Send templates created with the content template builder](https://www.twilio.com/docs/content/send-templates-created-with-the-content-template-builder)

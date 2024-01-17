## Twilio WhatsApp

Using the WhatsApp Business Platform with Twilio, you can send and receive messages to WhatsApp users using the same Twilio Messaging APIs you already know and enjoy. Dive into the Twilio SDKs and helper libraries, see our quickstart and API reference docs, read through guides on templates and Twilio phone numbers, and find the sample code you'll need.

### ENV Values to Update

When using Twilio to send whatsApp messages via their API/Client, you need to provide certain environment variables that hold the Twilio configuration details. Here are the ENV values you need to update:

```sh
# WhatsApp Twilio
ENABLE_WA_TWILIO=
TWILIO_WA_ACCOUNT_SID=
TWILIO_WA_AUTH_TOKEN=
TWILIO_WA_NUMBER= # From number
```

### Sample Request Body

Here's a sample request body:

```jsonc
{
    "channelType": 4,
    "data": {
        "to": "+919004812051",
        "message": "Your appointment is coming up on July 21 at 3PM"
    }
}
```

References
- https://www.twilio.com/docs/whatsapp
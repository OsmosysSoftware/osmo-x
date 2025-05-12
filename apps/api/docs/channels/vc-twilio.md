## Twilio Voice Call

Using the Twilio REST API, you can make outgoing calls to phones, SIP-enabled endpoints, and Twilio Voice SDK connections. With Twilio, you can quickly make and receive voice calls in your application.

### Values to Update in Database

When using Twilio to send Voice Calls via their API/Client, you need to provide certain variables that hold the Twilio configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 10 (for Twilio Voice Call)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key                   | Description               |
| --------------------- | ------------------------- |
| TWILIO_VC_ACCOUNT_SID | Twilio account SID        |
| TWILIO_VC_AUTH_TOKEN  | Twilio account auth token |

```jsonc
// Sample json to set in configuration field
{
  "TWILIO_VC_ACCOUNT_SID": "twilio-account-sid",
  "TWILIO_VC_AUTH_TOKEN": "twilio-auth-token"
}
```

### Sample Request Body

Here's a sample request body:

```jsonc
{
    // Assuming providerId 10 also has channelType 10
    "providerId": 10,
    "data": {
        "from": "+15005550006",  // The phone number, SIP address, or client identifier to call
        "to": "+91xxxxxxxxxx",  // The phone number or client identifier to use as the caller id
        // Set either `url` or `twiml`. If both are provided then `twiml` parameter will be ignored.
        "url": "http://your-server-url/calls/message",  // TwiML instructions for the call Twilio will use without fetching Twiml from url parameter. Max 4000 characters
        "twiml": "<Response><Say>Hello there!</Say></Response>" // The SID of the Application resource that will handle the call, if the call will be handled by an application
    }
}
```

For further payload information, check the following link:
- [Twilio "CallListInstanceCreateOptions" object on Github](https://github.com/twilio/twilio-node/blob/main/src/rest/api/v2010/account/call.ts)

### Dependencies

| Package Name | Version | Description                                                                                 |
| ------------ | ------- | ------------------------------------------------------------------------------------------- |
| twilio       | ^5.6.0  | Twilio client for sending SMS, making voice calls, and other communication functionalities. |

### References

- [Twilio Quickstart Guide](https://www.twilio.com/docs/voice/quickstart)
- [TwiML for Programmable Voice](https://www.twilio.com/docs/voice/twiml)

## Twilio SMS

Twilio enables sending SMS through its API, allowing developers to programmatically send and receive text messages worldwide. Users integrate Twilio's API into their applications, triggering automated SMS messages for various purposes such as notifications, alerts, and customer communications.

Refer to the messaging documentation to dive deeper into the features Twilio offers and understanding how it all works.

### Values to Update in Database

When using Twilio to send SMS messages via their API/Client, you need to provide certain variables that hold the Twilio configuration details. Here are the values you need to update:

```sh
# SMS Twilio
ENABLE_SMS_TWILIO=
TWILIO_SMS_ACCOUNT_SID=
TWILIO_SMS_AUTH_TOKEN=
TWILIO_SMS_NUMBER=  # From number
```

### Sample Request Body

Here's a sample request body:

```json
{
  "channelType": 5,
  "data": {
    "to": "+15005550006",
    "message": "Your appointment is coming up on March 21 at 2PM"
  }
}
```

### References

- https://www.twilio.com/docs/messaging/quickstart

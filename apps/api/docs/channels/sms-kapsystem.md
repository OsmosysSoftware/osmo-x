# KAPSystem SMS

KAPSystem enables sending SMS through its API, allowing developers to programmatically send and receive text messages worldwide. Users integrate KAPSystem's API into their applications, triggering automated SMS messages for various purposes such as notifications, alerts, and customer communications.

Refer to the messaging documentation to dive deeper into the features KAPSystem offers and understand how it all works.

### Values to Update in Database

When using KAPSystem to send SMS messages via their API/Client, you need to provide certain variables that hold the KAPSystem configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 8 (for KAPSystem SMS)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key                      | Description              |
| ------------------------ | ------------------------ |
| KAP_SMS_BASE_API_URL     | KAP SMS base API URL     |
| KAP_SMS_ACCOUNT_USERNAME | KAP SMS account username |
| KAP_SMS_ACCOUNT_PASSWORD | KAP SMS account password |
| KAP_SMS_FROM             | KAP SMS from             |

```jsonc
// Sample json to set in configuration field
{
    "KAP_SMS_BASE_API_URL":"http://<api-domain>/api/v3/sendsms/plain",
    "KAP_SMS_ACCOUNT_USERNAME": "your-username",
    "KAP_SMS_ACCOUNT_PASSWORD": "your-password",
    "KAP_SMS_FROM": "KAPMSG"
}
```

### Sample Request Body

Here's a sample request body:

```jsonc
{
    // Set your respective providerId. ChannelType associated with providerId should be 8 (KAPSystem SMS)
    "providerId": 2,
    "data": {
        "indiaDltContentTemplateId": "1707160146562806652",
        "indiaDltPrincipalEntityId":"1601100000000005964",
        "to": "+911234567890,+914578126395",
        "text": "Hello Ayush, your order #234K3J4 has been Shipped.\nThank you for using our service."
    }
}
```

### Dependencies

| Package Name  | Version | Description                                                                                           |
| ------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| @nestjs/axios | ^3.1.1  | Integration of Axios with NestJS for making HTTP requests.                                            |
| rxjs          | ^7.8.2  | Reactive extensions library for JavaScript, used for composing asynchronous and event-based programs. |

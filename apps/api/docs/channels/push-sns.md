# SNS Push Notification

AWS Simple Notification Service (SNS) enables sending push notifications to mobile devices through its API, allowing developers to programmatically send and receive push notifications worldwide. Users integrate AWS SNS's API into their applications, triggering automated push notifications for various purposes such as notifications, alerts, and customer communications.

Refer to the SNS documentation to dive deeper into the features AWS SNS offers and understand how it all works.

### Values to Update in Database

When using AWS SNS to send push notifications via their API/Client, you need to provide certain variables that hold the SNS configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 9 (for Push Notification SNS)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key                       | Description                   |
|---------------------------|-------------------------------|
| AWS_ACCESS_KEY_ID      | Access key for aws instance       |
| AWS_SECRET_ACCESS_KEY  | Secret access key for aws      |
| AWS_REGION  | Region of the aws instance     |

```jsonc
// Sample json to set in configuration field
{
    "AWS_ACCESS_KEY_ID":"Aws-Access-key",
    "AWS_SECRET_ACCESS_KEY":"Aws-Secret-Key",
    "AWS_REGION":"aws-region"
}
```

### Sample Request Body

Here's a sample request body:

```jsonc
{
    // Set your respective providerId. ChannelType associated with providerId should be 10 (Push Notification SNS)
    "providerId": 10,
    "data": {
        "title": "Test Notification",
        "body": "This is a Test Notification",
        "target": "arn:aws:sns:us-west-2:505884080245:endpoint/GCM/Incident_Reporter_Android/30e25ece-c1fc-38a9-af85-a56a64baefb4"
    }
}
```

### Dependencies

| Package Name       | Version    | Description                                                                                                                                                |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| aws-sdk          | ^2.814.0   | AWS SDK for JavaScript, used to interact with AWS services including SNS.     |

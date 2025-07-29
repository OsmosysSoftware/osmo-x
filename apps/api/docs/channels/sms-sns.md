# AWS SNS

Amazon Simple Notification Service (SNS) is a fully managed messaging service that supports application-to-application (A2A) and application-to-person (A2P) communication. Using AWS SNS, you can send SMS messages globally.

Refer to the SNS documentation to dive deeper into the features AWS SNS offers and understand how it all works.

## Values to Update in Database

When using AWS SNS to send SMS via their API/Client, you need to provide certain variables that hold the SNS configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 11 (for AWS SNS)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key                   | Description                 |
| --------------------- | --------------------------- |
| AWS_ACCESS_KEY_ID     | Access key for AWS instance |
| AWS_SECRET_ACCESS_KEY | Secret access key for AWS   |
| AWS_REGION            | Region of the AWS instance  |

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
    "providerId": 12,
    "data": {

        "to": "+919234567890",
        "message": "This is a test notification",
    }
}
```

For further payload information, check the following link:

### Documentation links

- [What is AWS SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [Official AWS documentation for SNS integration](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/sns-examples-sending-sms.html)

### Dependencies

| Package Name        | Version  | Description                                                               |
| ------------------- | -------- | ------------------------------------------------------------------------- |
| @aws-sdk/client-sns | ^3.855.0 | AWS SDK for JavaScript, used to interact with AWS services including SNS. |
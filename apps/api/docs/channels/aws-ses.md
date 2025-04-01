# AWS SES

Amazon Simple Email Service (SES) is an email platform that provides an easy, cost-effective way for you to send and receive email using your own email addresses and domains.

Refer to the SES documentation to dive deeper into the features AWS SES offers and understand how it all works.

## Values to Update in Database

When using AWS SES to send emails via their API/Client, you need to provide certain variables that hold the SES configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 12 (for AWS SES)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key                   | Description                 |
| --------------------- | --------------------------- |
| AWS_ACCESS_KEY_ID     | Access key for aws instance |
| AWS_SECRET_ACCESS_KEY | Secret access key for aws   |
| AWS_REGION            | Region of the aws instance  |

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
  "providerId": 11,
  "data": {
    "from": "sender@example.com",                  // Sender's email address
    "to": "recipient@example.com",                 // Recipient's email address
    "cc": "cc@example.com",                        // CC email address (optional)
    "bcc": "bcc@example.com",                      // BCC email address (optional)
    "subject": "Test subject",                     // Email subject
    "text": "This is a test notification",         // Plain text version of the email
    "html": "<b>This is a test notification</b>",  // HTML version of the email
    "replyTo": "replytestmail@gmail.com",          // If the recipient replies to the message, each address receives the reply (optional)
    "attachments": [                               // Attachments (optional)
      {
        "filename": "names.txt",
        "content": "John Doe\nJane Doe"
      },
    ],
  }
}
```
For further payload information check the following link: [AWS SDK SendEmailCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ses/command/SendEmailCommand/)

### Documentation links

- [What is AWS SES](https://docs.aws.amazon.com/ses/latest/dg/Welcome.html)
- [Official AWS documentation for SES integration](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/ses-examples-sending-email.html#ses-examples-sending-emails-prerequisites)
- [Official AWS documentation for sendRawEmailCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ses/command/SendRawEmailCommand/)
- [SES Transport using Nodemailer](https://nodemailer.com/transports/ses/)

### Dependencies

| Package Name        | Version  | Description                                                               |
| ------------------- | -------- | ------------------------------------------------------------------------- |
| @aws-sdk/client-ses | ^3.775.0 | AWS SDK for JavaScript, used to interact with AWS services including SES. |

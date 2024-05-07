## Mailgun

Mailgun is an email service provider that offers a RESTful API for sending emails from your Node.js application. Their official `npm` module, `mailgun.js`, makes it easy to integrate Mailgun into your Node.js app and send emails using API requests.

### Values to Update in Database

When using Mailgun to send emails via their API, you need to provide certain variables that hold the Mailgun configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 2 (for Mailgun)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key             | Description                                                     |
|-----------------|-----------------------------------------------------------------|
| MAILGUN_API_KEY | Your Mailgun API key                                            |
| MAILGUN_HOST    | Mailgun host; api.mailgun.net for US, api.eu.mailgun.net for EU |
| MAILGUN_DOMAIN  | Your Mailgun domain name                                        |

```jsonc
// Sample json to set in configuration field
{
  "MAILGUN_API_KEY": "your-api-key ",
  "MAILGUN_HOST": "api.mailgun.net ",
  "MAILGUN_DOMAIN": "your.mailgun.domain"
}
```

Make sure to replace `your-api-key`, `api.mailgun.net`, and `your.mailgun.domain` with the appropriate values as per your Mailgun account setup.

### Sample Request Body

Here's a sample request body:

```jsonc
{
  // Set your respective providerId. ChannelType associated with providerId should be 2 (Mailgun)
  "providerId": 2,
  "data": {
    "from": "sender@example.com",                   // Sender's email address
    "to": "recipient@example.com",                  // Recipient's email address
    "cc": "cc@example.com",                         // CC email address (optional)
    "bcc": "bcc@example.com",                       // BCC email address (optional)
    "subject": "Test subject",                      // Email subject
    "text": "This is a test notification",          // Plain text version of the email
    "html": "<b>This is a test notification</b>",   // HTML version of the email
    "attachment": [                                 // Attachments (optional)
      {
        "filename": "names.txt",
        "data": "John Doe\nJane Doe",
      },
    ],
  }
}
```

In addition to the provided fields, there are several other options you can include when calling the `messages.create` method:

- **to:** An array or comma-separated string of email addresses to send mail.
- **cc:** An array or comma-separated string of CC email addresses.
- **bcc:** An array or comma-separated string of BCC email addresses.
- **attachment:** An array of attachment objects, each containing `filename` and `data`. As of now we only support text content as mentioned in the example.

These options allow you to customize the email message according to your needs. Remember to adjust the options based on your specific use case and requirements.

Reference: https://documentation.mailgun.com/en/latest/api-sending.html
## Mailgun

Mailgun is an email service provider that offers a RESTful API for sending emails from your Node.js application. Their official `npm` module, `mailgun.js`, makes it easy to integrate Mailgun into your Node.js app and send emails using API requests.

### Values to Update in Database

When using Mailgun to send emails via their API, you need to provide certain variables that hold the Mailgun configuration details. Here are the values you need to update:

```sh
# Mailgun
ENABLE_MAILGUN=true
MAILGUN_API_KEY=your-api-key         # Your Mailgun API key
MAILGUN_HOST=api.mailgun.net         # Mailgun host; api.mailgun.net for US, api.eu.mailgun.net for EU
MAILGUN_DOMAIN=your.mailgun.domain   # Your Mailgun domain name
```

Make sure to replace `your-api-key`, `api.mailgun.net`, and `your.mailgun.domain` with the appropriate values as per your Mailgun account setup.

### Sample Request Body

Here's a sample request body:

```jsonc
{
  "providerId": 2,                                  // ChannelType associated with providerId should be 1 (Mailgun)
  "channelType": 2,
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
## SMTP - Simple Mail Transfer Protocol

SMTP (Simple Mail Transfer Protocol) is a protocol used for sending email messages between servers. Nodemailer is a popular Node.js library that allows you to send emails using various transport methods, including SMTP.

### Values to Update in Database

When using Nodemailer to send emails via SMTP, you need to provide certain variables that hold the SMTP server configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 1 (for SMTP)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key             | Description     |
|-----------------|-----------------|
| SMTP_HOST       | SMTP server hostname |
| SMTP_PORT       | Port number for SMTP (587 for TLS, 465 for SSL) |
| SMTP_USERNAME   | Your SMTP username for authentication |
| SMTP_PASSWORD   | Your SMTP password for authentication |

```jsonc
// Sample json to set in configuration field
{
  "SMTP_HOST": "smtp.example.com",
  "SMTP_PORT": 587,
  "SMTP_USERNAME": "your-smtp-username",
  "SMTP_PASSWORD": "your-smtp-password"
}
```

Make sure to replace `smtp.example.com`, `your-smtp-username`, and `your-smtp-password` with the appropriate values provided by your SMTP service provider.

### Sample Request Body

Here's a sample request body:

```jsonc
{
  // Set your respective providerId. ChannelType associated with providerId should be 1 (SMTP)
  "providerId": 1,
  "data": {
    "from": "sender@example.com",                  // Sender's email address
    "to": "recipient@example.com",                 // Recipient's email address
    "cc": "cc@example.com",                        // CC email address (optional)
    "bcc": "bcc@example.com",                      // BCC email address (optional)
    "subject": "Test subject",                     // Email subject
    "text": "This is a test notification",         // Plain text version of the email
    "html": "<b>This is a test notification</b>",  // HTML version of the email
    "attachments": [                               // Attachments (optional)
      {
          "filename": "names.txt",
          "content": "John Doe\nJane Doe",
      },
    ],
    "headers": {                                   // Custom headers (optional)
      "X-Custom-Header": "Custom Value"
    }
  }
}
```

In addition to the provided fields, there are several other options you can include when calling the `sendMail` function:

- **to:** An array or comma-separated string of email addresses to send mail.
- **cc:** An array or comma-separated string of CC email addresses.
- **bcc:** An array or comma-separated string of BCC email addresses.
- **attachments:** An array of attachment objects, each containing `filename` and `content`/`path`. As of now we only support text content as mentioned in the example.
- **headers:** Additional headers to include in the email.

These options allow you to customize the email message according to your needs. Remember to adjust the options based on your specific use case and requirements.

Reference: https://nodemailer.com/message/
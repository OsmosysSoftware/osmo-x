## Mailgun

Mailgun is an email service provider that offers a RESTful API for sending emails from your Node.js application. Their official `npm` module, `mailgun.js`, makes it easy to integrate Mailgun into your Node.js app and send emails using API requests.

### Values to Update in Database

When using Mailgun to send emails via their API, you need to provide certain variables that hold the Mailgun configuration details. Here are the values you need to update in the table `notify_providers`:

Create a new entry in the table `notify_providers` and set the fields - `name`, `application_id`, `user_id`.

- Set field `channel_type` = 2 (for Mailgun)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field:

| Key             | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| MAILGUN_API_KEY | Your Mailgun API key                                            |
| MAILGUN_HOST    | Mailgun host; api.mailgun.net for US, api.eu.mailgun.net for EU |
| MAILGUN_DOMAIN  | Your Mailgun domain name                                        |

```jsonc
// Sample JSON to set in the configuration field
{
  "MAILGUN_API_KEY": "your-api-key",
  "MAILGUN_HOST": "api.mailgun.net",
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
    "attachments": [                                 // Attachments (optional)
      {
        "filename": "names.txt",
        "content": "John Doe\nJane Doe",
      },
    ],
  }
}
```

In addition to the provided fields, there are several other options you can include when calling the `messages.create` method:

- **to:** An array or comma-separated string of email addresses to send mail.
- **cc:** An array or comma-separated string of CC email addresses.
- **bcc:** An array or comma-separated string of BCC email addresses.
- **attachments:** An array of attachment objects, each containing `filename` and `content`. Now we support multiple MIME types with Buffer from base64.

To create a base64 string from a file, you can use the following Node.js code:

```javascript
const fs = require('fs');

const filePath = 'path/to/your/file.pdf';
const fileData = fs.readFileSync(filePath);
const base64String = fileData.toString('base64');

console.log(base64String);  // This is your base64 string
```

To create a base64 string from a file in .NET, you can use the following C# code:

```csharp
using System;
using System.IO;

class Program
{
    static void Main()
    {
        string filePath = "path/to/your/file.pdf";
        byte[] fileBytes = File.ReadAllBytes(filePath);
        string base64String = Convert.ToBase64String(fileBytes);

        Console.WriteLine(base64String);  // This is your base64 string
    }
}
```

These options allow you to customize the email message according to your needs. Remember to adjust the options based on your specific use case and requirements.

### Dependencies

| Package Name | Version | Description                                              |
| ------------ | ------- | -------------------------------------------------------- |
| mailgun.js   | ^10.2.3 | A Mailgun client for JavaScript                          |
| form-data    | ^4.0.0  | Used by mailgun.js to handle form data for HTTP requests |

Reference: [Mailgun API Documentation](https://documentation.mailgun.com/en/latest/api-sending.html)

### iCal / Calendar invites

To send calendar invites include an `icalEvent` object inside the `data` payload. The `icalEvent` must provide either `content` (the iCal text) or `path` (a filesystem path to a .ics file accessible by the API server). Optional fields: `method` (e.g. `REQUEST`) and `filename` (defaults to `invite.ics`).

Example:

```jsonc
"data": {
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "Meeting invite",
  "html": "<p>See invite</p>",
  "icalEvent": {
    "method": "REQUEST",
    "filename": "meeting.ics",
    "content": "BEGIN:VCALENDAR\nVERSION:2.0\n...END:VCALENDAR"
  }
}
```

Notes:

- The Mailgun provider in this project builds a raw MIME message for calendar invites (using MailComposer) and sends it via the Mailgun API. Provide either `content` (preferably UTF-8 iCal text) or a `path` to a `.ics` file on disk.
- If you prefer to send an `.ics` as a regular attachment instead of a calendar invite, include it in the `attachments` array (use Base64 for binary files when required).

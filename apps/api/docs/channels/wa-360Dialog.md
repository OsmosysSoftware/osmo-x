## 360Dialog

360dialog is a leading and official accredited Meta WhatsApp solution provider (BSP), providing the relevant building blocks & services around messaging, WhatsApp newsletters and performance marketing with the WhatsApp Business API.

### Values to Update in Database

When using 360Dialog to send whatsApp messages via their API, you need to provide certain variables that hold the 360Dialog configuration details. Here are the values you need to update in table `notify_providers`:

Create a new entry in table `notify_providers` and set the fields - `name`, `application_id`, `user_id`

- Set field `channel_type` = 3 (for 360Dialog)
- Set field `is_enabled` = 1 (to enable the newly created provider)

Then set the following configurations in the `configuration` field

| Key             | Description     |
|-----------------|-----------------|
| WA_360_DIALOG_API_KEY    | WA 360 Dialog api key |
| WA_360_DIALOG_URL        | api url which is https://waba.360dialog.io/v1/messages |

```jsonc
// Sample json to set in configuration field
{
  "WA_360_DIALOG_API_KEY": "api-url",
  "WA_360_DIALOG_URL": "your-api-key"
}
```

Make sure to replace `your-api-key` and `api-url` with the appropriate values.

### Sample Request Body

Here's a sample request body:

```jsonc
{
    // Set your respective providerId. ChannelType associated with providerId should be 3 (360Dialog)
    "providerId": 3,
    "channelType": 3,
    "data": {
        "to": "919004812051",
        "type": "template",
        "template": {
            "namespace": "d8bcb6bd_2ab2_439c_9d9e_947501266c77",
            "name": "ir_incident_resolution",
            "language": {
                "policy": "deterministic",
                "code": "en"
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {
                            "type": "text",
                            "text": "Bishal Biswas"
                        },
                        {
                            "type": "text",
                            "text": "WNK227"
                        },
                        {
                            "type": "text",
                            "text": "Massive Earthquake"
                        },
                        {
                            "type": "text",
                            "text": "Power Grid"
                        },
                        {
                            "type": "text",
                            "text": "Bishal Mondal"
                        },
                        {
                            "type": "text",
                            "text": "Vikas"
                        },
                        {
                            "type": "text",
                            "text": "Open"
                        },
                        {
                            "type": "text",
                            "text": "10"
                        },
                        {
                            "type": "text",
                            "text": "15755"
                        }
                    ]
                }
            ]
        }
    }
}
```

References
- https://docs.360dialog.com/partner/first-steps/sandbox#example-request-payload
- https://docs.360dialog.com/partner/first-steps/sandbox#5.-send-a-template-message-optional
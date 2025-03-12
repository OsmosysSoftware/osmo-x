# OsmoX Test Mode Configuration and Usage Guide

The **Test Mode** feature in OsmoX enables administrators to toggle a testing environment for an `application`.

## Overview

- `Providers` associated with **test mode enabled** `application` **DO NOT** send notifications to end recipients.
- Every `application` can maintain a whitelist of recipients for which the notifications will be processed normally.

## Fields used for Test Mode

### testModeEnabled
This is binary flag to enable or disable test mode for an `application`.

- The flag `testModeEnabled` can have the following values:
  - `1`: Test mode is **_ON_**
  - `0`: Test mode is **_OFF_** - (Default Value)
- If an `application` is in test mode, all `providers` related to said `application` will not process notifications.
- These notifications will be automatically moved to SUCCESS status and a dummy response JSON will be set for them.

### whitelistRecipients
A JSON specifying `providers` and related recipients that will process notifications normally even if the `application` is in test mode.

- Can be **_null_** (no whitelist, meaning no restrictions) - (Default Value)
- If provided, must be a valid JSON object where:
  - Keys are **_providerId_** (string id identifying notification provider).
  - Values are arrays of **_recipient_** strings (e.g., email addresses, phone numbers).

- **_Provider Id_** used should belong to the application.

- **_Recipient_** is the data set in the **"to"** or **"target"** field of the [CreateNotification API](./api-documentation.md#create-notification) request body.
  - Multiple whitelisted recipient values can be set as array of strings for the related for `provider` key.
  - Values should be in array structure even if a single recipient is set.

- Whitelist can be added/updated even if `application` is not in test mode.

Example JSON to add whitelisted recipients for `provider` ids `6` and `18`:
```json
{
  "6": ["abcrecipient@gmail.com"],
  "18": ["+18900100002", "+18900100003", "+18900100004"]
}
```

## How to use the Test Mode Feature

### 1. Enable Test Mode for an `application`

Set application `testModeEnabled` field as 1 for **ON** and 0 for **OFF**

#### For existing application

Use the following cURL to call the graphql API [updateApplication](./api-documentation.md#update-an-application)

```curl
curl --location 'localhost:3000/graphql' \
--header 'Authorization: Bearer my-secure-token' \
--header 'Content-Type: application/json' \
--data '{"query":"mutation UpdateApplication($applicationId: Float!) {\r\n    updateApplication(updateApplicationInput: {\r\n        applicationId: $applicationId,\r\n        testModeEnabled: 1,\r\n    }) {\r\n        applicationId\r\n        name\r\n        userId\r\n        testModeEnabled\r\n        whitelistRecipients\r\n        createdOn\r\n        updatedOn\r\n        status\r\n    }\r\n}","variables":{"applicationId":2}}'
```

- Set the `applicationId` to be updated
- Set the `testModeEnabled` field as 1 for **ON**
- Set the Bearer token for admin user

#### For new application

Use the following cURL to call the graphql API [createNewApplication](./api-documentation.md#create-new-application)

```curl
curl --location 'localhost:3000/graphql' \
--header 'Authorization: Bearer my-secure-token' \
--header 'Content-Type: application/json' \
--data '{"query":"mutation CreateApplication\r\n{\r\n    application(createApplicationInput: {\r\n        name: \"<newApplicationName>\",\r\n        testModeEnabled: 1,\r\n    }) {\r\n        applicationId\r\n        name\r\n        userId\r\n        testModeEnabled\r\n        whitelistRecipients\r\n        createdOn\r\n        updatedOn\r\n        status\r\n    }\r\n}","variables":{}}'
```

- Set the `testModeEnabled` field as 1 for **ON**
- Set the Bearer token for admin user

### 2. Add Recipients to the Whitelist for related providers (Optional)

When test mode is enabled, you can restrict notifications to specific recipients for related `providers` by updating the whitelist. Add the whitelist as follows:

#### For existing application

Use the following cURL to call the graphql API [updateApplication](./api-documentation.md#update-an-application)

```curl
curl --location 'localhost:3000/graphql' \
--header 'Authorization: Bearer my-secure-token' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"mutation UpdateApplication($applicationId: Float!, $whitelistRecipients: JSONObject!) {\r\n    updateApplication(updateApplicationInput: {\r\n        applicationId: $applicationId,\r\n        testModeEnabled: 1,\r\n        whitelistRecipients: $whitelistRecipients,\r\n    }) {\r\n        applicationId\r\n        name\r\n        userId\r\n        testModeEnabled\r\n        whitelistRecipients\r\n        createdOn\r\n        updatedOn\r\n        status\r\n    }\r\n}","variables":{"applicationId":2,"whitelistRecipients":{"16":["abce@gmail.com","totestmail@gmail.co"],"18":["+918900100002","+918900100003","+918900100004"]}}}'
```

- Set the `applicationId` to be updated
- Set the `testModeEnabled` field as 1 for **ON** and 0 for **OFF**
- Set the Bearer token for admin user

#### For new application

Use the following cURL to call the graphql API [createNewApplication](./api-documentation.md#create-new-application)

```curl
curl --location 'localhost:3000/graphql' \
--header 'Authorization: Bearer my-secure-token' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"mutation CreateApplication($whitelistRecipients: JSONObject!) \r\n{\r\n    application(createApplicationInput: {\r\n        name: \"<newApplicationName>\",\r\n        testModeEnabled: 1,\r\n        whitelistRecipients: $whitelistRecipients,\r\n    }) {\r\n        applicationId\r\n        name\r\n        userId\r\n        testModeEnabled\r\n        whitelistRecipients\r\n        createdOn\r\n        updatedOn\r\n        status\r\n    }\r\n}","variables":{"whitelistRecipients":{"2":["abc@example.com","test@email.co"],"5":["+19800176002","+19800176003"]}}}'
```

- Set the `testModeEnabled` field as 1 for **ON** and 0 for **OFF**
- Set the Bearer token for admin user

### 3. Use the OsmoX create notification functionality normally

- Use the [CreateNotification API](./api-documentation.md#create-notification)
- All notifications created by `providers` of an `application` with test mode **_enabled_** will NOT be processed.
- If recipient is added in the whitelist, the notification will be processed.

## How to check for test mode Notifications

All notifications created by `providers` of an `application` with test mode **_enabled_** includes the following data:

- `delivery_status` is set as `SUCCESS`
- `result` column has the following data
  ```json
  {
    "result": "This is a test mode notification. Notification was not delivered to recipient."
  }
  ```
- `retry_count` is set as `0`

Users can filter the notifications on the above parameters for verification.

## Notes
- Always validate the whitelist JSON before submission to avoid errors (e.g., use a JSON validator tool).
- The [OsmoX API Postman Collection](./../OsmoX-API.postman_collection.json) contains sample requests that can be used for all OsmoX API calls mentioned in the guide.
- Database schema for table [notify_applications](./database-design.md#notify_applications)

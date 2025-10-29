# API Documentation

This document provides a brief overview of the different API endpoints, their usage and purpose.

## Postman Collection

- [API Collection](./../OsmoX-API.postman_collection.json)
- [Environment File](./../OsmoX-API.postman_environment.json)

## Authentication

This section lists the authentication related requests such as login.

### Login

- Allows the user to login into the portal and receive the `auth token` from the API.
- Requires the username and password values.
- The response token is used for Bearer Token Authorization as **Bearer `auth token`**

Note: Only users with `Admin` role get list of all keys. Returns `null` for users with `Basic` role.

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
mutation LoginUser {
  login(loginUserInput: { username: "admin", password: "mysecurepassword" }) {
    token
    __typename
  }
}
```

**cURL**

```sh
curl --location 'localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--data '{"query":"mutation LoginUser {\n  login(loginUserInput: { username: \"admin\", password: \"mysecurepassword\" }) {\n    token\n    __typename\n  }\n}","variables":{}}'
```

**Sample response**

```json
{
  "data": {
    "login": {
      "token": "eymysecuretoken",
      "__typename": "LoginResponse"
    }
  }
}
```

## Server API Key

This section lists the Server Key related requests such as new key generation.

### Generate new Server API Key

Generates a new server API key for the requested application. This key is used as the value for the **`x-api-key`** header.

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
mutation GenerateApiKey {
  generateApiKey(applicationId: 1)
}
```

**cURL**

```sh
curl --location 'localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer mysecuretoken' \
--data '{"query":"mutation GenerateApiKey {\n  generateApiKey(applicationId: 1)\n}","variables":{}}'
```

**Sample response**

```json
{
  "data": {
    "generateApiKey": "mySecureServerApiKey"
  }
}
```

## Notifications

This sections lists notification related requests such as creating new notifications and fetching all notifications.

### Create Notification

Allows the user to create a new notification for processing and sending it. Requires passing `x-api-key` token as header for validation.

**Note:**
- The **Provider** should have a valid `channelType`.
- The **Provider** should be enabled.
- The `application id` for the **Server API Key** and **Provider** should match.
- The `data` passed should have all the fields related to `channelType`.

Refer the [Available Channel Types](./usage-guide.md#6-available-channel-type-end-providers) for understanding the different channel types and [Delivery Status Information](./usage-guide.md#7-delivery-status-information) for understanding `deliveryStatus` in response.

**Endpoint:** `http://localhost:3000/notifications`

**Method:** `POST`

**Body:** `raw (json)`

```json
{
  "providerId": 1,
  "data": {
    "from": "sender@email.com",
    "to": "receiver@email.com",
    "subject": "Test subject",
    "text": "This is a test notification",
    "html": "<b>This is a test notification</b>"
  }
}
```

**cURL**

```sh
curl --location 'http://localhost:3000/notifications' \
--header 'Content-Type: application/json' \
--header 'x-api-key: mysecuretoken' \
--data-raw '{
  "providerId": 1,
  "data": {
    "from": "sender@email.com",
    "to": "receiver@email.com",
    "subject": "Test subject",
    "text": "This is a test notification",
    "html": "<b>This is a test notification</b>"
  }
}'
```

**Sample response**

```json
{
  "status": "success",
  "data": {
    "notification": {
      "providerId": 1,
      "channelType": 1,
      "data": {
        "from": "sender@email.com",
        "to": "receiver@email.com",
        "subject": "Test subject",
        "text": "This is a test notification",
        "html": "<b>This is a test notification</b>"
      },
      "applicationId": 2,
      "createdBy": "sampleFoundationApp",
      "updatedBy": "sampleFoundationApp",
      "result": null,
      "notificationSentOn": null,
      "providerChainId": null,
      "id": 92,
      "deliveryStatus": 1,
      "createdOn": "2024-02-12T07:24:21.000Z",
      "updatedOn": "2024-02-12T07:24:21.000Z",
      "status": 1,
      "retryCount": 0
    }
  }
}
```

### Fetch All Notifications

Allows the user to fetch all notifications based on the passed query parameters. Requires passing bearer token for authorization.

The different options that can be used while fetching notifications are as follows:

- `limit:` Limit the number of results to the provided value
- `offset:` Offset the result set by the provided value
- `sortBy:` Sort the results by the provided key
- `sortOrder:` Sort the results in either `ASC`ending or `DESC`ending order
- `search:` Search for the provided value in `createdBy`, `data` and `result` and return results matching it
- `filters:` Filter the results based on the provided `field`, `operator` and `value`. Operator can be `eq` (equal), `ne` (not equal), `contains`, `gt` (greater than) or `lt` (less than)

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
query {
  notifications(
    options: {
      limit: 1
      offset: 0
      sortBy: "createdOn"
      sortOrder: DESC
      search: "sender@email.com"
      filters: [{ field: "applicationId", operator: "eq", value: "1" }]
    }
  ) {
    notifications {
      applicationDetails {
        applicationId
        name
        userId
        status
        createdOn
        updatedOn
      }
      applicationId
      channelType
      createdBy
      createdOn
      data
      deliveryStatus
      id
      notificationSentOn
      providerId
      result
      status
      updatedBy
      updatedOn
    }
    total,
    offset,
    limit
  }
}
```

**cURL**

```sh
curl --location 'YOUR_BASE_URL/graphql' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"query {\r\n  notifications(\r\n    options: {\r\n      limit: 5\r\n      offset: 0\r\n      sortBy: \"createdOn\"\r\n      sortOrder: DESC\r\n      search: \"sender@email.com\"\r\n      filters: [{ field: \"applicationId\", operator: \"eq\", value: \"1\" }]\r\n    }\r\n  ) {\r\n    notifications {\r\n      applicationDetails {\r\n        applicationId\r\n        name\r\n        userId\r\n        status\r\n        createdOn\r\n        updatedOn\r\n      }\r\n      applicationId\r\n      channelType\r\n      createdBy\r\n      createdOn\r\n      data\r\n      deliveryStatus\r\n      id\r\n      notificationSentOn\r\n      providerId\r\n      result\r\n      status\r\n      updatedBy\r\n      updatedOn\r\n    }\r\n    total,\r\n    offset,\r\n    limit\r\n  }\r\n}","variables":{}}'
```

**Sample response**

```json
{
  "data": {
    "notifications": {
      "notifications": [
        {
          "applicationDetails": {
              "applicationId": 2,
              "name": "sampleOsmoXApp",
              "userId": 2,
              "status": 1,
              "createdOn": "2024-04-12T06:06:10.000Z",
              "updatedOn": "2024-04-12T06:06:10.000Z"
          },
          "applicationId": 2,
          "channelType": 1,
          "createdBy": "sampleOsmoXApp",
          "createdOn": "2024-02-12T07:26:25.000Z",
          "data": {
            "from": "sender@email.com",
            "to": "receiver@email.com",
            "subject": "Test subject",
            "text": "This is a test notification",
            "html": "<b>This is a test notification</b>"
          },
          "deliveryStatus": 3,
          "id": 93,
          "notificationSentOn": "2024-02-12T07:01:43.000Z",
          "providerId": 1,
          "result": {
            "result": {
              "accepted": ["receiver@email.com"],
              "rejected": [],
              "ehlo": ["PIPELINING", "8BITMIME", "SMTPUTF8", "AUTH LOGIN PLAIN"],
              "envelopeTime": 514,
              "messageTime": 396,
              "messageSize": 598,
              "response": "250 Accepted [STATUS=new MSGID=ZO8BDrs4Cney.EXBZcnPdyNjH.7avN-FAAAAmpIr4f.gj7e4YPfAABUQxYg]",
              "envelope": {
                "from": "sender@email.com",
                "to": ["receiver@email.com"]
              },
              "messageId": "<7d5f2937-d22c-ace0-1455-988520eeece0@email.com>"
            }
          },
          "status": 1,
          "updatedBy": "sampleOsmoXApp",
          "updatedOn": "2024-02-12T07:57:43.000Z"
        }
      ],
      "total": 5,
      "offset": 0,
      "limit": 1
    }
  }
}
```

### Fetch active or archived Notification by Id

Allows the user to fetch a single notification present in either `notify_notifications` or `notify_archived_notifications` table by passing notificationId. Requires passing bearer token for authorization.

The required parameter for fetching a single active or archived notification is as follows:

- `notificationId`

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
query {
  notification(
    notificationId: 150
  ) {
      applicationId
      channelType
      createdBy
      createdOn
      data
      deliveryStatus
      id
      notificationSentOn
      providerId
      result
      status
      updatedBy
      updatedOn
    }
}
```

**cURL**

```sh
curl --location 'localhost:3000/graphql' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data '{"query":"query {\r\n  notification(\r\n    notificationId: 150\r\n  ) {\r\n      applicationId\r\n      channelType\r\n      createdBy\r\n      createdOn\r\n      data\r\n      deliveryStatus\r\n      id\r\n      notificationSentOn\r\n      providerId\r\n      result\r\n      status\r\n      updatedBy\r\n      updatedOn\r\n    }\r\n}","variables":{}}'
```

**Sample response**

```json
{
  "data": {
    "notification": {
      "applicationId": 3,
      "channelType": 11,
      "createdBy": "Test3",
      "createdOn": "2025-02-14T12:25:23.000Z",
      "data": {
        "from": "fromtestmail@gmail.com",
        "to": "totestmail@gmail.co",
        "subject": "Test subject",
        "text": "This is a test notification",
        "html": "<b>This is a test notification</b>"
      },
      "deliveryStatus": 5,
      "id": 150,
      "notificationSentOn": null,
      "providerId": 16,
      "result": {
        "result": "This is a test mode notification. Notification was not delivered to recipient."
      },
      "status": 1,
      "updatedBy": "Test3",
      "updatedOn": "2025-02-14T12:25:23.000Z"
    }
  }
}
```

## Archived Notifications

This sections lists notification related requests such as fetching all archived notifications.

### Fetch All Archived Notifications

Allows the user to fetch all archived notifications based on the passed query parameters. Requires passing bearer token for authorization.

The different options that can be used while fetching notifications are as follows:

- `limit:` Limit the number of results to the provided value
- `offset:` Offset the result set by the provided value
- `sortBy:` Sort the results by the provided key
- `sortOrder:` Sort the results in either `ASC`ending or `DESC`ending order
- `search:` Search for the provided value in `createdBy`, `data` and `result` and return results matching it
- `filters:` Filter the results based on the provided `field`, `operator` and `value`. Operator can be `eq` (equal), `ne` (not equal), `contains`, `gt` (greater than) or `lt` (less than)

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
query {
  archivedNotifications(
    options: {
      limit: 5
      offset: 0
      sortBy: "createdOn"
      sortOrder: DESC
      search: "sender@email.com"
      filters: [{ field: "applicationId", operator: "eq", value: "1" }]
    }
  ) {
    archivedNotifications {
      applicationDetails {
        applicationId
        name
        userId
        status
        createdOn
        updatedOn
      }
      applicationId
      channelType
      createdBy
      createdOn
      data
      deliveryStatus
      id
      notificationId
      notificationSentOn
      providerId
      result
      status
      updatedBy
      updatedOn
    }
    total,
    offset,
    limit
  }
}
```

**cURL**

```sh
curl --location 'YOUR_BASE_URL/graphql' \
--header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"query {\r\n  archivedNotifications(\r\n    options: {\r\n      limit: 5\r\n      offset: 0\r\n      sortBy: \"createdOn\"\r\n      sortOrder: DESC\r\n      search: \"sender@email.com\"\r\n      filters: [{ field: \"applicationId\", operator: \"eq\", value: \"1\" }]\r\n    }\r\n  ) {\r\n    archivedNotifications {\r\n      applicationDetails {\r\n        applicationId\r\n        name\r\n        userId\r\n        status\r\n        createdOn\r\n        updatedOn\r\n      }\r\n      applicationId\r\n      channelType\r\n      createdBy\r\n      createdOn\r\n      data\r\n      deliveryStatus\r\n      id\r\n      notificationId\r\n      notificationSentOn\r\n      providerId\r\n      result\r\n      status\r\n      updatedBy\r\n      updatedOn\r\n    }\r\n    total,\r\n    offset,\r\n    limit\r\n  }\r\n}","variables":{}}'
```

**Sample response**

```json
{
    "data": {
        "archivedNotifications": {
            "archivedNotifications": [
                {
                    "applicationDetails": {
                        "applicationId": 1,
                        "name": "sampleOsmoXApp",
                        "userId": 1,
                        "status": 1,
                        "createdOn": "2024-04-29T08:06:41.000Z",
                        "updatedOn": "2024-04-29T08:06:41.000Z"
                    },
                    "applicationId": 1,
                    "channelType": 1,
                    "createdBy": "sampleOsmoXApp",
                    "createdOn": "2024-05-07T06:44:39.000Z",
                    "data": {
                        "from": "sender@email.com",
                        "to": "receiver@email.com",
                        "subject": "Test subject",
                        "text": "This is a test notification",
                        "html": "<b>This is a test notification</b>"
                    },
                    "deliveryStatus": 6,
                    "id": 7,
                    "notificationId": 9,
                    "notificationSentOn": "2024-07-03T06:10:08.000Z",
                    "providerId": 1,
                    "result": {
                        "result": {
                            "errno": -3008,
                            "code": "EDNS",
                            "syscall": "getaddrinfo",
                            "hostname": "some.smtp.host",
                            "command": "CONN"
                        }
                    },
                    "status": 1,
                    "updatedBy": "sampleOsmoXApp",
                    "updatedOn": "2024-07-03T06:18:08.000Z"
                }
            ],
            "total": 1,
            "offset": 0,
            "limit": 5
        }
    }
}
```

## Applications

This sections lists application related requests such as creating new application and fetching all applications.

### Create new Application

Allows the user with `Admin` role to create a new application. The fields `testModeEnabled` and `whitelistRecipients` are optional fields. Requires passing bearer token for authorization.

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
mutation CreateApplication
($whitelistRecipients: JSONObject!)
{
    application(createApplicationInput: {
        name: "<newApplicationName>",
        testModeEnabled: 0,
        whitelistRecipients: $whitelistRecipients,
    }) {
        applicationId
        name
        userId
        testModeEnabled
        whitelistRecipients
        createdOn
        updatedOn
        status
    }
}
```

**cURL**

```sh
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"mutation CreateApplication\r\n($whitelistRecipients: JSONObject!) \r\n{\r\n    application(createApplicationInput: {\r\n        name: \"<newApplicationName>\",\r\n        testModeEnabled: 0,\r\n        whitelistRecipients: $whitelistRecipients,\r\n    }) {\r\n        applicationId\r\n        name\r\n        userId\r\n        testModeEnabled\r\n        whitelistRecipients\r\n        createdOn\r\n        updatedOn\r\n        status\r\n    }\r\n}","variables":{"whitelistRecipients":{"2":["abc@example.com","test@email.co"],"5":["+19800176002","+19800176003"]}}}'
```

**Sample response**

```json
{
  "data": {
    "application": {
      "applicationId": 10,
      "name": "newSampleApp",
      "userId": 1,
      "testModeEnabled": 0,
      "whitelistRecipients": {
        "2": [
          "abc@example.com",
          "test@email.co"
        ],
        "5": [
          "+19800176002",
          "+19800176003"
        ]
      },
      "createdOn": "2025-02-20T08:04:07.000Z",
      "updatedOn": "2025-02-20T08:04:07.000Z",
      "status": 1
    }
  }
}
```

### Fetch all Applications

Allows the user to fetch all applications based on the passed query parameters. Requires passing bearer token for authorization.

Note: The API will return a successful response when the Bearer `authorization-token` passed is associated with an `Admin`.

The different options that can be used while fetching notifications are as follows:

- `limit:` Limit the number of results to the provided value
- `offset:` Offset the result set by the provided value
- `sortBy:` Sort the results by the provided key
- `sortOrder:` Sort the results in either `ASC`ending or `DESC`ending order
- `search:` Search for the provided value in `createdBy`, `data` and `result` and return results matching it
- `filters:` Filter the results based on the provided `field`, `operator` and `value`. Operator can be `eq` (equal), `ne` (not equal), `contains`, `gt` (greater than) or `lt` (less than)

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
query {
  applications(
    options: {
      limit: 5
      offset: 0
      sortBy: "createdOn"
      sortOrder: ASC
      search: "key"
      filters: [{ field: "applicationId", operator: "eq", value: "2" }]
    }
  ) {
    applications {
        applicationId
        name
        userId
        testModeEnabled
        whitelistRecipients
        createdOn
        updatedOn
        status
    }
    total,
    offset,
    limit
  }
}
```

**cURL**

```sh
curl --location 'http://localhost:3000/graphql' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"query {\r\n  applications(\r\n    options: {\r\n      limit: 5\r\n      offset: 0\r\n      sortBy: \"createdOn\"\r\n      sortOrder: ASC\r\n    #   search: \"Pinestem\"\r\n      #filters: [{ field: \"applicationId\", operator: \"eq\", value: \"1\" }]\r\n    }\r\n  ) {\r\n    applications {\r\n        applicationId\r\n        name\r\n        userId\r\n        testModeEnabled\r\n        whitelistRecipients\r\n        createdOn\r\n        updatedOn\r\n        status\r\n    }\r\n    total,\r\n    offset,\r\n    limit\r\n  }\r\n}","variables":{}}'
```

**Sample response**

```json
{
  "data": {
    "applications": {
      "applications": [
        {
          "applicationId": 1,
          "name": "sampleTestXApp",
          "userId": 2,
          "createdOn": "2024-04-29T08:13:47.000Z",
          "updatedOn": "2024-04-29T08:14:07.000Z",
          "status": 1
        },
        {
          "applicationId": 2,
          "name": "newSampleApp",
          "userId": 1,
          "createdOn": "2024-04-29T09:47:30.000Z",
          "updatedOn": "2024-04-29T09:47:30.000Z",
          "status": 1
        }
      ],
      "total": 2,
      "offset": 0,
      "limit": 5
    }
  }
}
```

### Update an Application

Allows the user to update the `application name`, `test mode toggle`, `whitelist recipients` for the requested `applicationId`. Requires passing bearer token for authorization.

Note: The API will return a successful response when the Bearer `authorization-token` passed is associated with an `Admin`.

The required parameter for updating an application is as follows:

- `applicationId`

The optional parameter for updating an application is as follows:

- `name`: String of updated application name
- `testModeEnabled`: Set 1 to enable or 0 to disable test mode
- `whitelistRecipients`: Whitelist must be either null or a valid JSON with string of provider id as keys and arrays of strings of recipients as values

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
mutation UpdateApplication($applicationId: Float!, $whitelistRecipients: JSONObject!) {
    updateApplication(updateApplicationInput: {
        applicationId: $applicationId,
        name: "<updatedApplicationName>",
        testModeEnabled: 1,
        whitelistRecipients: $whitelistRecipients,
    }) {
        applicationId
        name
        userId
        testModeEnabled
        whitelistRecipients
        createdOn
        updatedOn
        status
    }
}
```

**cURL**

```sh
curl --location 'localhost:3000/graphql' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"mutation UpdateApplication($applicationId: Float!, $whitelistRecipients: JSONObject!) {\r\n    updateApplication(updateApplicationInput: {\r\n        applicationId: $applicationId,\r\n        name: \"<updatedApplicationName>\",\r\n        testModeEnabled: 1,\r\n        whitelistRecipients: $whitelistRecipients,\r\n    }) {\r\n        applicationId\r\n        name\r\n        userId\r\n        testModeEnabled\r\n        whitelistRecipients\r\n        createdOn\r\n        updatedOn\r\n        status\r\n    }\r\n}","variables":{"applicationId":2,"whitelistRecipients":{"2":["abc@example.com","test@email.co"],"15":["+19800176002","+19800176003"]}}}'
```

**Sample response**

```json
{
  "data": {
    "updateApplication": {
      "applicationId": 2,
      "name": "<updatedApplicationName>",
      "userId": 2,
      "testModeEnabled": 1,
      "whitelistRecipients": {
        "2": [
          "abc@example.com",
          "test@email.co"
        ],
        "15": [
          "+19800176002",
          "+19800176003"
        ]
      },
      "createdOn": "2024-04-29T08:12:55.000Z",
      "updatedOn": "2025-02-19T13:04:32.000Z",
      "status": 1
    }
  }
}
```

## Providers

This sections lists providers related requests such as creating new provider and fetching all providers.

### Create new Provider

Allows the user with `Admin` role to create a new Provider. Requires passing bearer token for authorization.

Users can create a new provider by selecting a `channel type` from the available `Master Providers` in the database.

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
mutation CreateProvider {
    provider(createProviderInput: {
        applicationId: 5,
        channelType: 2,
        configuration: {},
        isEnabled: 1,
        name: "Mailgun PineStem",
        userId: 1,
    }) {
        applicationId
        channelType
        configuration
        isEnabled
        name
        userId
        createdOn
        updatedOn
        status
    }
}
```

**cURL**

```sh
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer OsmoX-test-key' \
--data '{"query":"mutation CreateProvider {\n    provider(createProviderInput: {\n        applicationId: 5,\n        channelType: 2,\n        configuration: {},\n        isEnabled: 1,\n        name: \"Mailgun PineStem\",\n        userId: 1,\n    }) {\n        applicationId\n        channelType\n        configuration\n        isEnabled\n        name\n        userId\n        createdOn\n        updatedOn\n        status\n    }\n}","variables":{}}'
```

**Sample response**

```json
{
    "data": {
        "provider": {
            "applicationId": 5,
            "channelType": 2,
            "configuration": {},
            "isEnabled": 1,
            "name": "Mailgun PineStem",
            "userId": 1,
            "createdOn": "2024-06-23T09:30:39.000Z",
            "updatedOn": "2024-06-23T09:30:39.000Z",
            "status": 1
        }
    }
}
```

### Fetch all Providers

Allows the user to fetch all providers based on the passed query parameters. Requires passing bearer token for authorization.

The different options that can be used while fetching providers are as follows:

- `limit:` Limit the number of results to the provided value
- `offset:` Offset the result set by the provided value
- `sortBy:` Sort the results by the provided key
- `sortOrder:` Sort the results in either `ASC`ending or `DESC`ending order
- `search:` Search for the provided value in `createdBy`, `data` and `result` and return results matching it
- `filters:` Filter the results based on the provided `field`, `operator` and `value`. Operator can be `eq` (equal), `ne` (not equal), `contains`, `gt` (greater than) or `lt` (less than)

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
query {
  providers(
    options: {
      limit: 5
      offset: 0
      sortBy: "createdOn"
      sortOrder: ASC
    }
  ) {
    providers {
        providerId
        name
        channelType
        configuration
        isEnabled
        userId
        createdOn
        updatedOn
        status
    }
    total,
    offset,
    limit
  }
}
```

**cURL**

```sh
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer OsmoX-test-key' \
--data '{"query":"query {\r\n  providers(\r\n    options: {\r\n      limit: 5\r\n      offset: 0\r\n      sortBy: \"createdOn\"\r\n      sortOrder: ASC\r\n    }\r\n  ) {\r\n    providers {\r\n        providerId\r\n        name\r\n        channelType\r\n        configuration\r\n        isEnabled\r\n        userId\r\n        createdOn\r\n        updatedOn\r\n        status\r\n    }\r\n    total,\r\n    offset,\r\n    limit\r\n  }\r\n}","variables":{}}'
```

**Sample response**

```json
{
    "data": {
        "providers": {
            "providers": [
                {
                    "providerId": 4,
                    "name": "Twilio WhatsApp Business Pinestem",
                    "channelType": 7,
                    "configuration": {},
                    "isEnabled": 1,
                    "userId": 1,
                    "createdOn": "2024-05-20T11:26:36.000Z",
                    "updatedOn": "2024-05-20T11:26:36.000Z",
                    "status": 1
                },
                {
                    "providerId": 6,
                    "name": "Mailgun PineStem",
                    "channelType": 2,
                    "configuration": {},
                    "isEnabled": 1,
                    "userId": 1,
                    "createdOn": "2024-06-21T09:46:27.000Z",
                    "updatedOn": "2024-06-21T09:46:27.000Z",
                    "status": 1
                }
            ],
            "total": 2,
            "offset": 0,
            "limit": 5
        }
    }
}
```

## Redis Queue Cleanup

This endpoint allows manual cleanup of completed and failed jobs from Redis queues to reduce memory usage.

### Cleanup Redis Jobs

Removes completed and failed jobs from all BullMQ queues in Redis.

**Endpoint:** `http://localhost:3000/notifications/redis/cleanup`

**Method:** `POST`

**Query Parameters:**
- `gracePeriod` (optional): Time in milliseconds. Only jobs older than this will be removed. Default: `0` (all jobs)

**Example 1: Clean all jobs**

```sh
curl -X POST http://localhost:3000/notifications/redis/cleanup
```

**Example 2: Clean jobs older than 1 hour**

```sh
curl -X POST "http://localhost:3000/notifications/redis/cleanup?gracePeriod=3600000"
```

**Sample Response (Success)**

```json
{
  "status": "success",
  "data": {
    "message": "Redis job cleanup completed successfully",
    "summary": {
      "totalCompletedJobsRemoved": 1543,
      "totalFailedJobsRemoved": 234,
      "totalJobsRemoved": 1777,
      "queuesProcessed": 12
    },
    "details": [
      {
        "name": "SEND-SMTP-1",
        "completed": 543,
        "failed": 23
      },
      {
        "name": "SEND-MAILGUN-2",
        "completed": 234,
        "failed": 45
      },
      {
        "name": "WEBHOOK-SMTP-1",
        "completed": 766,
        "failed": 166
      }
    ]
  }
}
```

**Sample Response (Error)**

```json
{
  "status": "error",
  "message": "Failed to cleanup Redis jobs",
  "data": {
    "error": "Connection refused"
  }
}
```

**Notes:**
- This endpoint does not require authentication
- Cleanup is performed on all active queues
- The operation may take several seconds depending on the number of jobs
- See [Redis Cleanup Guide](./redis-cleanup-guide.md) for detailed information on automatic cleanup configuration

## Webhook

Kindly go through the [Webhook Guide](./webhook-guide.md).

## Provider Chain

This sections lists providers related requests such as creating new provider and fetching all providers.

### Create new Provider Chain

Allows the user with `Admin` role to create a new Provider Chain. Requires passing bearer token for authorization.

**Endpoint:** `http://localhost:3000/provider-chains`

**Method:** `POST`

**Body:** `json`

```jsonc
{
    "chainName": "new-chain-name",
    "applicationId": 1,
    "providerType": 4,
    "description": "sample description",
    "isDefault": 0
}
```

**cURL**

```sh
curl --location 'localhost:3000/provider-chains' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data '{
    "chainName": "new-chain-name",
    "applicationId": 1,
    "providerType": 4,
    "description": "sample description",
    "isDefault": 0
}'
```

**Sample response**

```json
{
    "status": "success",
    "data": {
        "providerChain": {
            "chainName": "new-chain-name",
            "applicationId": 1,
            "providerType": 4,
            "description": "sample description",
            "isDefault": 0,
            "chainId": 9,
            "createdOn": "2025-10-12T02:00:18.307Z",
            "updatedOn": "2025-10-12T02:00:18.307Z",
            "status": 1
        }
    }
}
```

### Fetch all Provider Chains

Allows the user to fetch all provider chains based on the passed query parameters. Requires passing bearer token for authorization.

The different options that can be used while fetching provider chains are as follows:

- `limit:` Limit the number of results to the provided value
- `offset:` Offset the result set by the provided value
- `sortBy:` Sort the results by the provided key
- `sortOrder:` Sort the results in either `ASC`ending or `DESC`ending order
- `search:` Search for the provided value in `createdBy`, `data` and `result` and return results matching it
- `filters:` Filter the results based on the provided `field`, `operator` and `value`. Operator can be `eq` (equal), `ne` (not equal), `contains`, `gt` (greater than) or `lt` (less than)

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
query {
  providerChains(
    options: {
      limit: 5
      offset: 0
      sortBy: "createdOn"
      sortOrder: ASC
    }
  ) {
    providerChains{
        chainId
        chainName
        description
        providerType
        applicationId
        applicationDetails {
            applicationId
            name
            userId
            status
            createdOn
            updatedOn
        }
        createdOn
        updatedOn
        status
    }
    total,
    offset,
    limit
  }
}
```

**cURL**

```sh
curl --location 'localhost:3000/graphql' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data '{"query":"query {\r\n  providerChains(\r\n    options: {\r\n      limit: 5\r\n      offset: 0\r\n      sortBy: \"createdOn\"\r\n      sortOrder: ASC\r\n    }\r\n  ) {\r\n    providerChains{\r\n        chainId\r\n        chainName\r\n        description\r\n        providerType\r\n        applicationId\r\n        applicationDetails {\r\n            applicationId\r\n            name\r\n            userId\r\n            status\r\n            createdOn\r\n            updatedOn\r\n        }\r\n        createdOn\r\n        updatedOn\r\n        status\r\n    }\r\n    total,\r\n    offset,\r\n    limit\r\n  }\r\n}","variables":{}}'
```

**Sample response**

```json
{
    "data": {
        "providerChains": {
            "providerChains": [
                {
                    "chainId": 1,
                    "chainName": "email-reliable",
                    "description": "Email provider chain",
                    "providerType": 1,
                    "applicationId": 1,
                    "applicationDetails": {
                        "applicationId": 1,
                        "name": "sampleOsmoXApp",
                        "userId": 1,
                        "status": 1,
                        "createdOn": "2024-04-29T08:06:41.000Z",
                        "updatedOn": "2025-10-06T08:24:12.413Z"
                    },
                    "createdOn": "2025-07-22T11:12:19.214Z",
                    "updatedOn": "2025-07-25T06:01:15.647Z",
                    "status": 1
                },
                {
                    "chainId": 2,
                    "chainName": "sms-reliable",
                    "description": "Reliable sms provider chain",
                    "providerType": 2,
                    "applicationId": 2,
                    "applicationDetails": {
                        "applicationId": 2,
                        "name": "SampleFoundationXApp",
                        "userId": 2,
                        "status": 1,
                        "createdOn": "2024-04-29T08:12:55.000Z",
                        "updatedOn": "2025-02-27T11:54:29.000Z"
                    },
                    "createdOn": "2025-07-22T12:55:32.744Z",
                    "updatedOn": "2025-08-20T08:24:23.987Z",
                    "status": 1
                },
                {
                    "chainId": 3,
                    "chainName": "whatsapp-business-reliable",
                    "description": "WhatsApp business provider chain",
                    "providerType": 3,
                    "applicationId": 1,
                    "applicationDetails": {
                        "applicationId": 1,
                        "name": "sampleOsmoXApp",
                        "userId": 1,
                        "status": 1,
                        "createdOn": "2024-04-29T08:06:41.000Z",
                        "updatedOn": "2025-10-06T08:24:12.413Z"
                    },
                    "createdOn": "2025-07-24T11:18:55.764Z",
                    "updatedOn": "2025-07-24T12:11:41.744Z",
                    "status": 1
                }
            ],
            "total": 3,
            "offset": 0,
            "limit": 5
        }
    }
}
```

### Update Provider Chain

Allows the user with `Admin` role to update existing Provider Chain. Requires passing bearer token for authorization.

**Endpoint:** `http://localhost:3000/provider-chains`

**Method:** `PUT`

**Body:** `json`

```jsonc
{
    "chainId": 10,
    "chainName": "updated-chain-name",
    "applicationId": 1,
    "providerType": 3,
    "description": "sample updated description",
    "isDefault": 0
}
```

**cURL**

```sh
curl --location --request PUT 'localhost:3000/provider-chains' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data '{
    "chainId": 10,
    "chainName": "updated-chain-name",
    "applicationId": 1,
    "providerType": 3,
    "description": "sample updated description",
    "isDefault": 0
}'
```

**Sample response**

```json
{
    "status": "success",
    "data": {
        "updatedProviderChain": {
            "chainId": 10,
            "chainName": "updated-chain-name-4",
            "applicationId": 1,
            "providerType": 3,
            "description": "sample updated description",
            "isDefault": 0,
            "createdOn": "2025-10-12T02:01:31.011Z",
            "updatedOn": "2025-10-12T02:50:33.360Z",
            "status": 1
        }
    }
}
```

### Delete Provider Chain

Allows the user with `Admin` role to delete existing Provider Chain. Requires passing bearer token for authorization.

**Endpoint:** `http://localhost:3000/provider-chains`

**Method:** `DELETE`

**Body:** `json`

```jsonc
{
    "chainId": 10
}
```

**cURL**

```sh
curl --location --request DELETE 'localhost:3000/provider-chains' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data '{
    "chainId": 10
}'
```

**Sample response**

```json
{
    "status": "success",
    "data": {
        "chainId": 10,
        "deleted": true,
        "providerChainMembersDeleted": [
            10
        ]
    }
}
```

## Provider Chain Members

This sections lists providers related requests such as creating new provider and fetching all providers.

### Create new Provider Chain Member

Allows the user with `Admin` role to create a new Provider Chain Member. Requires passing bearer token for authorization.

**Endpoint:** `http://localhost:3000/provider-chain-members`

**Method:** `POST`

**Body:** `json`

```json
{
    "chainId": 10,
    "providerId": 23,
    "isActive": 1
}
```

**cURL**

```sh
curl --location 'localhost:3000/provider-chain-members' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data '{
    "chainId": 10,
    "providerId": 23,
    "isActive": 1
}'
```

**Sample response**

```json
{
    "status": "success",
    "data": {
        "providerChainMember": {
            "chainId": 10,
            "providerId": 23,
            "priorityOrder": 2,
            "isActive": 1,
            "id": 12,
            "createdOn": "2025-10-12T03:06:23.771Z",
            "updatedOn": "2025-10-12T03:06:23.771Z",
            "status": 1
        }
    }
}
```

### Fetch all Provider Chain Members

Allows the user to fetch all providers based on the passed query parameters. Requires passing bearer token for authorization.

The different options that can be used while fetching providers are as follows:

- `limit:` Limit the number of results to the provided value
- `offset:` Offset the result set by the provided value
- `sortBy:` Sort the results by the provided key
- `sortOrder:` Sort the results in either `ASC`ending or `DESC`ending order
- `search:` Search for the provided value in `createdBy`, `data` and `result` and return results matching it
- `filters:` Filter the results based on the provided `field`, `operator` and `value`. Operator can be `eq` (equal), `ne` (not equal), `contains`, `gt` (greater than) or `lt` (less than)

**Endpoint:** `http://localhost:3000/graphql`

**Method:** `POST`

**Body:** `graphql`

```graphql
query {
  providers(
    options: {
      limit: 5
      offset: 0
      sortBy: "createdOn"
      sortOrder: ASC
    }
  ) {
    providers {
        providerId
        name
        channelType
        configuration
        isEnabled
        userId
        createdOn
        updatedOn
        status
    }
    total,
    offset,
    limit
  }
}
```

**cURL**

```sh
curl --location 'localhost:3000/graphql' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data '{"query":"query {\r\n  providerChainMembers(\r\n    options: {\r\n      limit: 5\r\n      offset: 0\r\n      sortBy: \"createdOn\"\r\n      sortOrder: ASC\r\n    }\r\n  ) {\r\n    providerChainMembers{\r\n        id\r\n        chainId\r\n        providerChainDetails {\r\n            chainId\r\n            chainName\r\n            description\r\n            providerType\r\n            applicationId\r\n            createdOn\r\n            updatedOn\r\n            status\r\n        }\r\n        priorityOrder\r\n        isActive\r\n        providerId\r\n        providerDetails {\r\n            providerId\r\n            name\r\n            channelType\r\n            isEnabled\r\n            configuration\r\n            applicationId\r\n            userId\r\n            status\r\n        }\r\n        createdOn\r\n        updatedOn\r\n        status\r\n    }\r\n    total,\r\n    offset,\r\n    limit\r\n  }\r\n}","variables":{}}'
```

**Sample response**

```json
{
    "data": {
        "providers": {
            "providers": [
                {
                    "providerId": 4,
                    "name": "Twilio WhatsApp Business Pinestem",
                    "channelType": 7,
                    "configuration": {},
                    "isEnabled": 1,
                    "userId": 1,
                    "createdOn": "2024-05-20T11:26:36.000Z",
                    "updatedOn": "2024-05-20T11:26:36.000Z",
                    "status": 1
                },
                {
                    "providerId": 6,
                    "name": "Mailgun PineStem",
                    "channelType": 2,
                    "configuration": {},
                    "isEnabled": 1,
                    "userId": 1,
                    "createdOn": "2024-06-21T09:46:27.000Z",
                    "updatedOn": "2024-06-21T09:46:27.000Z",
                    "status": 1
                }
            ],
            "total": 2,
            "offset": 0,
            "limit": 5
        }
    }
}
```

### Update Provider Chain Member Priotity Order

Allows the user with `Admin` role to update priority order for Provider Chain Members. Requires passing bearer token for authorization.

**Endpoint:** `http://localhost:3000/provider-chain-members/priority-order`

**Method:** `PUT`

**Body:** `json`

```jsonc
{
    "chainId": 10,
    "newProviderPriorityOrder": [23, 3]
}
```

**cURL**

```sh
curl --location --request PUT 'localhost:3000/provider-chain-members/priority-order' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data '{
    "chainId": 10,
    "newProviderPriorityOrder": [23, 3]
}'
```

**Sample response**

```json
{
    "status": "success",
    "data": {
        "updatedProviderChainMembers": [
            {
                "id": 12,
                "chainId": 10,
                "providerId": 23,
                "priorityOrder": 1,
                "isActive": 1,
                "createdOn": "2025-10-12T03:06:23.771Z",
                "updatedOn": "2025-10-12T03:07:09.876Z",
                "status": 1
            },
            {
                "id": 10,
                "chainId": 10,
                "providerId": 3,
                "priorityOrder": 2,
                "isActive": 1,
                "createdOn": "2025-10-12T02:59:39.061Z",
                "updatedOn": "2025-10-12T03:07:09.876Z",
                "status": 1
            }
        ]
    }
}
```

### Delete Provider Chain Member by Provider Id

Allows the user with `Admin` role to delete existing Provider Chain Member. Requires passing bearer token for authorization.

Deleted chain member priority order is set as negative of the chain id. This ensures it does not interfere with provider chain fallback functionailty.

Priority order is automatically updated for rest of the undeleted chain members if any.

**Endpoint:** `http://localhost:3000/provider-chain-members`

**Method:** `DELETE`

**Body:** `json`

```jsonc
{
    "chainId": 10,
    "providerId": 23
}
```

**cURL**

```sh
curl --location --request DELETE 'localhost:3000/provider-chain-members' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data '{
    "chainId": 10,
    "providerId": 23
}'
```

**Sample response**

```json
{
    "status": "success",
    "data": {
        "deletedProviderChainMember": {
            "id": 12,
            "chainId": 10,
            "providerId": 23,
            "priorityOrder": -12,
            "isActive": 1,
            "createdOn": "2025-10-12T03:06:23.771Z",
            "updatedOn": "2025-10-12T03:10:56.155Z",
            "status": 0
        }
    }
}
```

### Restore Provider Chain Member by Provider Id

Allows the user with `Admin` role to restore a deleted Provider Chain Member. Requires passing bearer token for authorization.

Priority order is updated to be 1 greater than number of active chain members.

**Endpoint:** `http://localhost:3000/provider-chain-members/restore`

**Method:** `PUT`

**Body:** `json`

```jsonc
{
    "chainId": 10,
    "providerId": 23
}
```

**cURL**

```sh
curl --location --request PUT 'localhost:3000/provider-chain-members/restore' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data '{
    "chainId": 10,
    "providerId": 23
}'
```

**Sample response**

```json
{
    "status": "success",
    "data": {
        "updatedProviderChainMembers": {
            "id": 12,
            "chainId": 10,
            "providerId": 23,
            "priorityOrder": 2,
            "isActive": 1,
            "createdOn": "2025-10-12T03:06:23.771Z",
            "updatedOn": "2025-10-12T03:12:00.934Z",
            "status": 1
        }
    }
}
```

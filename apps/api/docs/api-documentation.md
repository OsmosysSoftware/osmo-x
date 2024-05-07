# API Documentation

This document provides a brief overview of the different API endpoints, their usage and purpose.

## Authentication

This section lists the authentication related requests such as login.

### Login

Allows the user to login into the portal and receive the auth token from the API. Requires the username and password values.

Note: Only users with `Admin` role get list of all keys. Returns `null` for users with `Basic` role.

**Endpoint:** `http://localhost:3000/graphql`

**Method: `POST`**

**Body:** `graphql`

```graphql
mutation LoginUser {
  login(loginUserInput: { username: "admin", password: "mysecurepassword" }) {
    token
    user
    allKeys {
      apiKeyId
      apiKey
      applicationId
      status
    }
    __typename
  }
}
```

**cURL**

```sh
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"mutation LoginUser {\n  login(loginUserInput: { username: \"admin\", password: \"mysecurepassword\" }) {\n    token\n    user\n    allKeys {\n       apiKeyId\n       apiKey\n       applicationId\n       status\n    }\n    __typename\n  }\n}","variables":{}}'
```

**Sample response**

```json
{
  "data": {
    "login": {
      "token": "mysecuretoken",
      "user": "admin",
      "allKeys": [
        {
          "apiKeyId": 1,
          "apiKey": "test-api-key",
          "applicationId": 1,
          "status": 1
        },
        {
          "apiKeyId": 2,
          "apiKey": "test-api-key-2",
          "applicationId": 2,
          "status": 1
        }
      ],
      "__typename": "LoginResponse"
    }
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

Refer the [Available Channel Types](./usage-guide.md#5-available-channel-types) for understanding the different channel types and [Delivery Status Information](./usage-guide.md#6-delivery-status-information) for understanding `deliveryStatus` in response.

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
      "id": 92,
      "deliveryStatus": 1,
      "createdOn": "2024-02-12T07:24:21.000Z",
      "updatedOn": "2024-02-12T07:24:21.000Z",
      "status": 1
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
      filters: [{ field: "channelType", operator: "eq", value: "1" }]
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
      providerDetails {
        providerId
        name
        channelType
        isEnabled
        configuration
        applicationId
        userId
        status
      }
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
curl --location 'http://localhost:3000/graphql' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"query {\n  notifications(\n    options: {\n      limit: 5\n      offset: 0\n      sortBy: \"createdOn\"\n      sortOrder: DESC\n      #search: \"sender@email.com\"\n      #filters: [{ field: \"channelType\", operator: \"eq\", value: \"1\" }]\n    }\n  ) {\n    notifications {\n      applicationDetails {\n        applicationId\n        name\n        userId\n        status\n      }\n      applicationId\n      channelType\n      createdBy\n      createdOn\n      data\n      deliveryStatus\n      id\n      providerDetails {\n        providerId\n        name\n        channelType\n        isEnabled\n        configuration\n        applicationId\n        userId\n        status\n      }\n      providerId\n      result\n      status\n      updatedBy\n      updatedOn\n    }\n    total,\n    offset,\n    limit\n  }\n}","variables":{}}'
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
          "providerDetails": {
            "providerId": 1,
            "name": "SMTP",
            "channelType": 1,
            "isEnabled": 1,
            "configuration": {
              "SMTP_HOST": "some.smtp.host",
              "SMTP_PORT": 123,
              "SMTP_USERNAME": "someusername",
              "SMTP_PASSWORD": "somepassword"
            },
            "applicationId": 1,
            "userId": 1,
            "status": 1
          },
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

## Applications

This sections lists application related requests such as creating new application and fetching all applications.

### Create new Application

Allows the user with `Admin` role to create a new application.

**Endpoint:** `http://localhost:3000/graphql`

**Method: `POST`**

**Body:** `graphql`

```graphql
mutation CreateApplication {
  application(createApplicationInput: {
    name: "newSampleApp",
    userId: 2,
  }) {
    applicationId
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
--data-raw '{"query":"mutation CreateApplication {\n    application(createApplicationInput: {\n        name: \"newSampleApp\",\n        userId: 2,\n    }) {\n        applicationId\n        name\n        userId\n        createdOn\n        updatedOn\n        status\n    }\n}","variables":{}}'
```

**Sample response**

```json
{
  "data": {
    "application": {
      "applicationId": 4,
      "name": "newSampleApp",
      "userId": 2,
      "createdOn": "2024-04-29T09:47:30.000Z",
      "updatedOn": "2024-04-29T09:47:30.000Z",
      "status": 1
    }
  }
}
```

### Fetch all Applications

Allows the user to fetch all applications based on the passed query parameters. Requires passing bearer token for authorization.

Note: The API will return a successful response when the `server-api-key` passed uses `application_id` that is associated with an `Admin`.

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
--data-raw '{"query":"query {\n  applications(\n    options: {\n      limit: 5\n      offset: 2\n      sortBy: \"createdOn\"\n      sortOrder: ASC\n      #search: \"key\"\n      #filters: [{ field: \"applicationId\", operator: \"eq\", value: \"1\" }]\n    }\n  ) {\n    applications {\n        applicationId\n        name\n        userId\n        createdOn\n        updatedOn\n        status\n    }\n    total,\n    offset,\n    limit\n  }\n}","variables":{}}'
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

# API Documentation

This document provides a brief overview of the different API endpoints, their usage and purpose.

## Authentication

This section lists the authentication related requests such as login.

### Login

Allows the user to login into the portal and receive the auth token from the API. Requires the username and password values.

**Endpoint:** `http://localhost:3000/graphql`

**Method: `POST`**

**Body:** `graphql`

```graphql
mutation LoginUser {
  login(loginUserInput: { username: "admin", password: "mysecurepassword" }) {
    token
    user
    __typename
  }
}
```

**cURL**

```sh
curl --location 'http://localhost:3000/graphql' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"mutation LoginUser {\n  login(loginUserInput: { username: \"admin\", password: \"mysecurepassword\" }) {\n    token\n    user\n    __typename\n  }\n}","variables":{}}'
```

**Sample response**

```json
{
  "data": {
    "login": {
      "token": "mysecuretoken",
      "user": "admin",
      "__typename": "LoginResponse"
    }
  }
}
```

## Notifications

This sections lists notification related requests such as creating new notifications and fetching all notifications.

### Create Notification

Allows the user to create a new notification for processing and sending it. Requires passing bearer token for authorization.

Refer the [Available Channel Types](./usage-guide.md#5-available-channel-types) for understanding the different channel types and [Delivery Status Information](./usage-guide.md#6-delivery-status-information) for understanding `deliveryStatus` in response.

**Endpoint:** `http://localhost:3000/notifications`

**Method:** `POST`

**Body:** `raw (json)`

```json
{
  "channelType": 1,
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
--header 'Authorization: Bearer mysecuretoken' \
--data-raw '{
  "channelType": 1,
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
      "channelType": 1,
      "data": {
        "from": "sender@email.com",
        "to": "receiver@email.com",
        "subject": "Test subject",
        "text": "This is a test notification",
        "html": "<b>This is a test notification</b>"
      },
      "applicationId": 1002,
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
      channelType
      createdBy
      createdOn
      data
      deliveryStatus
      id
      result
      status
      updatedBy
      updatedOn
    }
  }
}
```

**cURL**

```sh
curl --location 'http://localhost:3000/graphql' \
--header 'Authorization: Bearer mysecuretoken' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"query {\n  notifications(options: {\n    limit: 1,\n    offset: 0,\n    sortBy: \"createdOn\",\n    sortOrder: DESC,\n    search: \"sender@email.com\",\n    filters: [\n      { field: \"channelType\", operator: \"eq\", value: \"1\" },\n    ]\n  }) {\n    notifications {\n      channelType\n      createdBy\n      createdOn\n      data\n      deliveryStatus\n      id\n      result\n      status\n      updatedBy\n      updatedOn\n    }\n  }\n}","variables":{}}'
```

**Sample response**

```json
{
  "data": {
    "notifications": {
      "notifications": [
        {
          "channelType": 1,
          "createdBy": "OsmoX",
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
          "updatedBy": "OsmoX",
          "updatedOn": "2024-02-12T07:57:43.000Z"
        }
      ]
    }
  }
}
```

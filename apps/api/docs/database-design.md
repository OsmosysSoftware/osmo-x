# Database Design

This document provides a comprehensive and structured overview of the database design for OsmoX.

It serves as a reference guide for stakeholders, including developers, database administrators, project managers, and other parties involved in the development, maintenance, and understanding of the application's database.

The tables discussed below are created as part of the database migration.

## Database Schema

The database schema consists of the following tables:

- **notify_applications:** Contains details about all the current applications
- **notify_archived_notifications:** Contains details about all the completed notifications that have been archived
- **notify_master_providers:** Contains details about the basic provider types and configuration JSON
- **notify_migrations:** Contains the migration records
- **notify_notification_retries:** Contains details of retries
- **notify_notifications:** Contains details about all the notifications created
- **notify_providers:** Contains details about all the different providers, along with their configurations
- **notify_server_api_keys:** Contains details about different API keys for the different applications
- **notify_users:** Contains details about all the users
- **notify_webhooks:** Contains webhook urls for providers

This schema can be visualized in the following image:

![OsmoX API Database Schema](./assets/OsmoX_database_schema.png)

The ERD diagram file for this schema can be accessed [here](./assets/OsmoX_database_schema.erd).

## Data Dictionary

### notify_applications

| Attribute            | Data Type    | Not Null | Default             | Description                                                                    |
| -------------------- | ------------ | -------- | ------------------- | ------------------------------------------------------------------------------ |
| application_id       | int(11)      | True     |                     | Primary key, unique identifier for the application                             |
| name                 | varchar(255) | True     |                     | Name of the application                                                        |
| user_id              | int(11)      | True     |                     | User ID of the user associated with this application                           |
| created_on           | timestamp    | True     | current_timestamp() | Stores the timestamp for the creation of the notification                      |
| updated_on           | timestamp    | True     | current_timestamp() | Stores the timestamp for the last update to the notification                   |
| status               | tinyint(4)   | True     | 1                   | Stores whether the notification must be considered as active(1) or inactive(0) |
| test_mode_enabled    | tinyint(4)   | True     | 0                   | Stores whether test mode is enabled(1) or disabled(0) for the application      |
| whitelist_recipients | text         | False    | NULL                | Stores whitelisted recipients for application providers in JSON format         |

### notify_archived_notifications

| Attribute            | Data Type    | Not Null | Default             | Description                                                                                                                                                                                                    |
| -------------------- | ------------ | -------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                   | int(11)      | True     |                     | Primary key, stores the id value for different archived notifications                                                                                                                                          |
| notification_id      | int(11)      | True     |                     | Indexed. Stores the original id value of the notification                                                                                                                                                      |
| channel_type         | tinyint(4)   | True     |                     | Foreign Key. Identifier for related master_provider. Stores the channel type used for the notification. Can be a value from [Available Channel Types](./usage-guide.md#6-available-channel-type-end-providers) |
| data                 | text         | True     |                     | Stores JSON data about the notification such as the from/to addresses, subject and body content                                                                                                                |
| delivery_status      | tinyint(4)   | True     | 1                   | Indexed. Stores the current delivery status of the notification. Can be a value from [Delivery Status Information](./usage-guide.md#7-delivery-status-information)                                             |
| result               | text         | False    | NULL                | Stores the JSON result after attempting to send the notification                                                                                                                                               |
| created_on           | timestamp    | True     | current_timestamp() | Stores the timestamp for the creation of the notification                                                                                                                                                      |
| updated_on           | timestamp    | True     | current_timestamp() | Stores the timestamp for the last update to the notification                                                                                                                                                   |
| created_by           | varchar(255) | True     |                     | Stores the name of the service/app that created the notification                                                                                                                                               |
| updated_by           | varchar(255) | True     |                     | Stores the name of the service/app that last updated the notification                                                                                                                                          |
| status               | tinyint(4)   | True     | 1                   | Stores whether the notification must be considered as active(1) or inactive(0)                                                                                                                                 |
| application_id       | int(11)      | False    | NULL                | Stores the id value for related application_id                                                                                                                                                                 |
| provider_id          | int(11)      | False    | NULL                | Foreign key. Identifier for related provider. Stores the id value for related active provider                                                                                                                  |
| retry_count          | int(3)       | True     | 0                   | Identifies the retry count for the notification                                                                                                                                                                |
| notification_sent_on | timestamp    | False    | NULL                | Stores the time when notification was sent to end provider for processing                                                                                                                                      |

### notify_master_providers

| Attribute     | Data Type    | Not Null | Default             | Description                                                                                                                                                                                                                           |
| ------------- | ------------ | -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| master_id     | tinyint(4)   | True     |                     | Primary key, unique identifier for the provider                                                                                                                                                                                       |
| name          | varchar(255) | True     |                     | Name of the provider                                                                                                                                                                                                                  |
| provider_type | tinyint(4)   | True     | 1                   | The type of the provider, e.g., SMS, Email, WhatsApp, etc                                                                                                                                                                             |
| configuration | text         | True     |                     | Master JSON data for storing configuration details for this provider, to be used in frontend. This will be storing what all values need to be provided for setting up a provider. [Example pattern](#example-pattern-master-provider) |
| created_on    | timestamp    | True     | current_timestamp() | Stores the timestamp for the creation of the notification                                                                                                                                                                             |
| updated_on    | timestamp    | True     | current_timestamp() | Stores the timestamp for the last update to the notification                                                                                                                                                                          |
| status        | tinyint(4)   | True     | 1                   | Stores whether the notification must be considered as active(1) or inactive(0)                                                                                                                                                        |

#### Example pattern master provider

Consider a pattern like this:

```jsonc
{
  "apikey": {
    "label": "API Key",
    "id": "apikey",
    "pattern": "^[0-19]10$",
    "type": "number",
  }, {}, {} etc
}
```

[Back to notify_master_providers](#notify_master_providers)

### notify_migrations

| Attribute | Data Type    | Not Null | Default | Description                                                    |
| --------- | ------------ | -------- | ------- | -------------------------------------------------------------- |
| id        | int(11)      | True     |         | Primary key, stores the id value for different migrations      |
| timestamp | bigint(20)   | True     |         | Stores the timestamp for when the migration record was created |
| name      | varchar(255) | True     |         | Stores the name of the migration ran                           |

### notify_notification_retries

| Attribute       | Data Type  | Not Null | Default             | Description                                                                    |
| --------------- | ---------- | -------- | ------------------- | ------------------------------------------------------------------------------ |
| id              | int(11)    | True     |                     | Primary key, unique identifier for notification retry                          |
| notification_id | int(11)    | True     |                     | Unique identifier for id of notification in retry loop                         |
| retry_count     | int(11)    | True     |                     | Identifies retry number                                                        |
| retry_result    | longtext   | False    | NULL                | Contains retry result                                                          |
| created_on      | timestamp  | True     | current_timestamp() | Stores the timestamp for the creation of the notification                      |
| updated_on      | timestamp  | True     | current_timestamp() | Stores the timestamp for the last update to the notification                   |
| status          | tinyint(4) | True     | 1                   | Stores whether the notification must be considered as active(1) or inactive(0) |

### notify_notifications

| Attribute            | Data Type    | Not Null | Default             | Description                                                                                                                                                                                                    |
| -------------------- | ------------ | -------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                   | int(11)      | True     |                     | Primary key, stores the id value for different notifications                                                                                                                                                   |
| channel_type         | tinyint(4)   | True     |                     | Foreign Key. Identifier for related master_provider. Stores the channel type used for the notification. Can be a value from [Available Channel Types](./usage-guide.md#6-available-channel-type-end-providers) |
| data                 | text         | True     |                     | Stores JSON data about the notification such as the from/to addresses, subject and body content                                                                                                                |
| delivery_status      | tinyint(4)   | True     | 1                   | Stores the current delivery status of the notification. Can be a value from [Delivery Status Information](./usage-guide.md#7-delivery-status-information)                                                      |
| result               | text         | False    | NULL                | Stores the JSON result after attempting to send the notification                                                                                                                                               |
| created_on           | timestamp    | True     | current_timestamp() | Stores the timestamp for the creation of the notification                                                                                                                                                      |
| updated_on           | timestamp    | True     | current_timestamp() | Stores the timestamp for the last update to the notification                                                                                                                                                   |
| created_by           | varchar(255) | True     |                     | Stores the name of the service/app that created the notification                                                                                                                                               |
| updated_by           | varchar(255) | True     |                     | Stores the name of the service/app that last updated the notification                                                                                                                                          |
| status               | tinyint(4)   | True     | 1                   | Stores whether the notification must be considered as active(1) or inactive(0)                                                                                                                                 |
| application_id       | int(11)      | False    | NULL                | Stores the id value for related application_id                                                                                                                                                                 |
| provider_id          | int(11)      | False    | NULL                | Foreign key. Identifier for related provider. Stores the id value for related active provider                                                                                                                  |
| retry_count          | int(3)       | True     | 0                   | Identifies the retry count for the notification                                                                                                                                                                |
| notification_sent_on | timestamp    | False    | NULL                | Stores the time when notification was sent to end provider for processing                                                                                                                                      |


### notify_providers

| Attribute      | Data Type    | Not Null | Default             | Description                                                                                                                                                                                                                    |
| -------------- | ------------ | -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| provider_id    | tinyint(4)   | True     |                     | Primary key, unique identifier for the provider                                                                                                                                                                                |
| name           | varchar(255) | True     |                     | Name of the provider                                                                                                                                                                                                           |
| channel_type   | tinyint(4)   | True     |                     | Stores the channel type used for the notification. Can be a value from [Available Channel Types](./usage-guide.md#6-available-channel-type-end-providers)                                                                      |
| is_enabled     | tinyint(4)   | True     |                     | Stores whether the provider is enabled or not                                                                                                                                                                                  |
| configuration  | text         | True     |                     | Master JSON data for storing configuration details for this provider, to be used in frontend. This will be storing what all values need to be provided for setting up a provider. [Example pattern](#example-pattern-provider) |
| application_id | int(11)      | True     |                     | Unique identifier for the application                                                                                                                                                                                          |
| user_id        | int(11)      | True     |                     | User ID of the user associated with this application                                                                                                                                                                           |
| created_on     | timestamp    | True     | current_timestamp() | Stores the timestamp for the creation of the notification                                                                                                                                                                      |
| updated_on     | timestamp    | True     | current_timestamp() | Stores the timestamp for the last update to the notification                                                                                                                                                                   |
| status         | tinyint(4)   | True     | 1                   | Stores whether the notification must be considered as active(1) or inactive(0)                                                                                                                                                 |

#### Example pattern provider

Consider a pattern like this:

```jsonc
{
  "SMTP_HOST":"some.smtp.host",
  "SMTP_PORT":123,
  "SMTP_USERNAME":"someusername",
  "SMTP_PASSWORD":"somepassword"
}
```

[Back to notify_providers](#notify_providers)

### notify_server_api_keys

| Attribute      | Data Type    | Not Null | Default             | Description                                                                    |
| -------------- | ------------ | -------- | ------------------- | ------------------------------------------------------------------------------ |
| api_key_id     | int(11)      | True     |                     | Primary key, unique identifier for the server API key                          |
| api_key        | varchar(255) | True     |                     | Server API key for this application. Unique for each application               |
| application_id | int(11)      | True     |                     | Foreign key, identifier for the application                                    |
| created_on     | timestamp    | True     | current_timestamp() | Stores the timestamp for the creation of the notification                      |
| updated_on     | timestamp    | True     | current_timestamp() | Stores the timestamp for the last update to the notification                   |
| status         | tinyint(4)   | True     | 1                   | Stores whether the notification must be considered as active(1) or inactive(0) |

### notify_users

| Attribute  | Data Type    | Not Null | Default             | Description                                                                    |
| ---------- | ------------ | -------- | ------------------- | ------------------------------------------------------------------------------ |
| user_id    | int(11)      | True     |                     | Primary key, unique identifier for the user                                    |
| username   | varchar(255) | True     |                     | Username of the user                                                           |
| password   | varchar(255) | True     |                     | Hashed password of the user                                                    |
| role       | tinyint(4)   | True     | 0                   | Role of the user: BASIC (0) or ADMIN (1)                                       |
| created_on | timestamp    | True     | current_timestamp() | Stores the timestamp for the creation of the notification                      |
| updated_on | timestamp    | True     | current_timestamp() | Stores the timestamp for the last update to the notification                   |
| status     | tinyint(4)   | True     | 1                   | Stores whether the notification must be considered as active(1) or inactive(0) |

### notify_webhooks

Guide on [Webhook Integration](./webhook-guide.md)

| Attribute   | Data Type    | Not Null | Default             | Description                                                                    |
| ----------- | ------------ | -------- | ------------------- | ------------------------------------------------------------------------------ |
| id          | int(11)      | True     |                     | Primary key, unique identifier for the webhook                                 |
| provider_id | int(11)      | True     |                     | Foreign key, unique identifier for the provider                                |
| webhookUrl  | varchar(255) | False    | NULL                | Contains webhook url to be triggered                                           |
| is_verified | tinyint(4)   | True     | 0                   | Identifies if the webhook has been verified or not                             |
| created_on  | timestamp    | True     | current_timestamp() | Stores the timestamp for the creation of the notification                      |
| updated_on  | timestamp    | True     | current_timestamp() | Stores the timestamp for the last update to the notification                   |
| status      | tinyint(4)   | True     | 1                   | Stores whether the notification must be considered as active(1) or inactive(0) |

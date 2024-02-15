# Database Design

This document provides a comprehensive and structured overview of the database design for OsmoX.

It serves as a reference guide for stakeholders, including developers, database administrators, project managers, and other parties involved in the development, maintenance, and understanding of the application's database.

The tables discussed below are created as part of the database migration.

## Database Schema

The database schema consists of the following 2 tables:

- **notify_migrations:** Contains the migration records
- **notify_notifications:** Contains details about all the notifications created

This schema can be visualized in the following image:

![OsmoX API Database Schema](./assets/OsmoX_database_schema.png)

The ERD diagram file for this schema can be accessed [here](./assets/OsmoX_database_schema.erd).

## Data Dictionary

### notify_migrations

| Attribute | Data Type    | Not Null | Default | Description                                                    |
| --------- | ------------ | -------- | ------- | -------------------------------------------------------------- |
| id        | int(11)      | True     |         | Primary key, stores the id value for different migrations      |
| timestamp | bigint(20)   | True     |         | Stores the timestamp for when the migration record was created |
| name      | varchar(255) | True     |         | Stores the name of the migration ran                           |

### notify_notifications

| Attribute       | Data Type    | Not Null | Default             | Description                                                                                                                                               |
| --------------- | ------------ | -------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id              | int(11)      | True     |                     | Primary key, stores the id value for different notifications                                                                                              |
| channel_type    | tinyint(4)   | True     |                     | Stores the channel type used for the notification. Can be a value from [Available Channel Types](./usage-guide.md#5-available-channel-types)              |
| data            | text         | True     |                     | Stores JSON data about the notification such as the from/to addresses, subject and body content                                                           |
| delivery_status | tinyint(4)   | True     | 1                   | Stores the current delivery status of the notification. Can be a value from [Delivery Status Information](./usage-guide.md#6-delivery-status-information) |
| result          | text         | False    | NULL                | Stores the JSON result after attempting to send the notification                                                                                          |
| created_on      | timestamp    | True     | current_timestamp() | Stores the timestamp for the creation of the notification                                                                                                 |
| updated_on      | timestamp    | True     | current_timestamp() | Stores the timestamp for the last update to the notification                                                                                              |
| created_by      | varchar(255) | True     |                     | Stores the name of the service/app that created the notification                                                                                          |
| updated_by      | varchar(255) | True     |                     | Stores the name of the service/app that last updated the notification                                                                                     |
| status          | tinyint(4)   | True     | 1                   | Stores whether the notification must be considered as active(1) or inactive(0)                                                                            |

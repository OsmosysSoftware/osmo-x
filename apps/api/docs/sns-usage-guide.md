## Usage Guide for Sending SNS Push Notifications

### Prerequisites

- **AWS Account:** Ensure you have an AWS account.
- **IAM User with SNS Permissions:** Ensure IAM user have appropriate permissions to use AWS SNS.
- **SNS Topic:** Have an SNS topic if you haven't already.
- **Platform Application:** Have a platform application in SNS for your push notifications (e.g., GCM for Android, APNS for iOS).
- **Endpoint Arn:** Obtain the endpoint ARN for the device you wish to send the notification to.

### Message Payloads for SNS Push Notifications

When sending push notifications through AWS SNS, the message payload varies based on the target platform. Below are the sample message structures for Android (GCM/FCM) and iOS (APNS).

The payload consists of two fields: `message` and `target`.

- `message` : This will contain the properly formatted actual notification payload
- `target` : This will the targetArn on which you want to send push notification

#### Android (GCM/FCM) Payload

For Android devices, the payload should follow the GCM/FCM structure. Here is the sample payload

```json
{
    "providerId": 10,
    "data": {
        "message": {
            "GCM": "{\"notification\":{\"title\":\"Test Notification\",\"body\":\"This is a test notification\"}}"},
        "target": "arn:aws:sns:us-west-2:505884080245:endpoint/GCM/OQSHA-Android/7fb080a5-..."
    }
}
```

- **title**: The title of the notification.
- **body**: The body text of the notification.
- **icon**: The icon to display in the notification.

#### iOS (APNS) Payload

For iOS devices, the payload should follow the APNS structure. Here is the Sample payload:

```json
{
    "providerId": 10,
    "data": {
        "message": {
             "APNS_SANDBOX": "{\"aps\":{\"alert\":{\"title\":\"Hello World\",\"body\":\"This is a test message\"},\"sound\":\"default\"}}"
        },
        "target": "arn:aws:sns:us-west-2:505884080245:endpoint/APNS_SANDBOX/OQSHA-iOS-Dev/57711edf-..."
    }
}
```

- **aps**: The root level dictionary.
  - **alert**: The dictionary containing the notification's title and body.
    - **title**: The title of the notification.
    - **body**: The body text of the notification.
  - **sound**: The sound to play when the notification is received. "default" plays the standard notification sound.

### Commonly Used Fields in Push Notification Payloads

When crafting push notification payloads for different platforms, it's essential to understand the commonly used fields and their purposes. Below are the details for the most frequently used fields in both Android (GCM/FCM) and iOS (APNS) payloads.

#### Android (GCM/FCM) Payload Fields

- **title**: The title of the notification.
  - Example: `"title": "New Message"`

- **body**: The body text of the notification.
  - Example: `"body": "You have a new message"`

- **icon**: The icon to display in the notification.
  - Example: `"icon": "ic_notification"`

- **sound**: The sound to play when the device receives the notification.
  - Example: `"sound": "default"`

- **click_action**: The action associated with a user click on the notification. Can be used to define what happens when the notification is clicked.
  - Example: `"click_action": "OPEN_ACTIVITY"`

- **data**: Custom key-value pairs that can be used to pass additional information to the app.
  - Example: `"data": {"key1": "value1", "key2": "value2"}`

- **priority**: The priority of the message. Valid values are "normal" and "high".
  - Example: `"priority": "high"`

- **ttl**: Time to live. Specifies how long (in seconds) the message should be kept in FCM storage if the device is offline.
  - Example: `"ttl": "3600s"` (1 hour)

#### iOS (APNS) Payload Fields

- **aps**: The Apple Push Notification Service dictionary.
  - **alert**: The notification content.
    - **title**: The title of the notification.
      - Example: `"title": "New Message"`
    - **body**: The body text of the notification.
      - Example: `"body": "You have a new message"`
  - **sound**: The sound to play when the notification is received.
    - Example: `"sound": "default"`
  - **badge**: The number to display as the badge of the app icon.
    - Example: `"badge": 1`
  - **content-available**: A value of 1 indicates that new content is available.
    - Example: `"content-available": 1`
  - **category**: Identifier of the notification type for custom actions.
    - Example: `"category": "NEW_MESSAGE_CATEGORY"`

- **custom data**: Any additional data you want to include.
  - Example: `"customKey": "customValue"`

### Detailed Explanation

- **title**: Specifies the notification title. It's what users see as the title in the notification drawer.
- **body**: Specifies the notification message. It's the main content users see in the notification drawer.
- **icon**: Specifies the icon to display with the notification (Android).
- **sound**: Specifies the sound to play when the notification arrives.
- **click_action**: Defines the action to perform when the user clicks the notification (Android).
- **data**: Provides additional custom data to the application (Android).
- **priority**: Sets the priority of the message (Android).
- **ttl**: Sets how long the message should be kept if the device is offline (Android).
- **aps**: Root dictionary for Apple notifications.
  - **alert**: Contains the notification's title and body.
  - **badge**: Sets the number to display on the app icon.
  - **content-available**: Indicates new content is available and can trigger background processing.
  - **category**: Used to define custom actions for the notification.
- **customKey**: Example of a custom data field.

By correctly utilizing these fields, you can tailor your push notifications to deliver the desired user experience on both Android and iOS platforms.

For more details can check this official documentation : [link](https://docs.aws.amazon.com/sns/latest/dg/sns-send-custom-platform-specific-payloads-mobile-devices.html)

### Usage in SNS

When you receive the formatted message and targetArn from the user, ensure the message payload conforms to the above structures for the respective platforms. The message is then passed to AWS SNS along with the targetArn for notification to be sent.

By ensuring the message payload is correctly formatted for the target platform, you can seamlessly send push notifications through AWS SNS.
